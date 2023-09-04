import { NextFunction, Request, Response } from "express";
import ticketModel from "../models/tickets.model";
import { createReadStream, fstat, readFileSync, unlink } from "fs-extra";
import { FileArray, UploadedFile } from "express-fileupload";
import readline from "readline";
import CsvReadableStream from "csv-reader";
import zohoAuth from "../utils/zoho/auth";
import FormData from "form-data";
import fetch from "node-fetch";
import path from "path";
import fs from "fs-extra";
import downloadAttachment from "../utils/downloadAttachent";
import axios from "axios";
import https from 'https'

const ticketsController = {
  getAll: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const call = await ticketModel.find({
        "comments.attachments": {
          $ne: [],
        },
        brand_id: 360001479978,
      });

      const comments = await ticketModel.find({
        comments: {
          $ne: [],
        },
        brand_id: 360001479978,
        idZoho: null,
      });

      res.status(200).send({
        count: comments,
      });
    } catch (err: any) {
      return res.status(500).send({
        msg: err.message,
      });
    }
  },
  uploadJSON: async (req: Request, res: Response, next: NextFunction) => {
    const { json } = req.files as FileArray;
    const { tempFilePath } = json as UploadedFile;
    try {
      // Read the JSON File
      const fileJSON = createReadStream(tempFilePath, "utf8");
      const rl = readline.createInterface({
        input: fileJSON,
        crlfDelay: Infinity,
      });

      var i = 0;

      const timerSeconds = async (row: any) => {
        return new Promise((resolve, reject) => {
          setTimeout(async () => {
            const res = await uploadToDB(row);
            i += 1;
            if (res) {
              resolve("resulto");
            }
          }, 10000 * i);
        });
      };

      async function uploadToDB(data: any) {
        return true;
      }

      // Array with data to upload DB
      const arrayToUpload: any = [];
      // Read every line of the json document
      rl.on("line", (line: any) => {
        const data = JSON.parse(line);

        // Reassing and delete "id" key
        const changeKey = Object.assign(data, { idTicket: data["id"] });
        delete data["id"];
        // Push the object to array
        arrayToUpload.push({
          ...changeKey,
          idTicket: changeKey.idTicket.toString(),
        });
      }).on("close", async () => {
        // console.log(arrayToUpload)
        // Insert all the documents
        const call = await ticketModel.insertMany(arrayToUpload);

        console.log(call);
        // Delete file json
        unlink(tempFilePath);
        return res.status(200).send({
          msg: "Successfully upload JSON.",
          count: call.length,
        });
      });
    } catch (err: any) {
      return res.status(500).send({
        msg: err.message,
      });
    }
  },
  uploadCSV: async (req: Request, res: Response, next: NextFunction) => {
    const { csv } = req.files as FileArray;
    const { tempFilePath } = csv as UploadedFile;
    try {
      // Search all departments
      const optionsDepartment = {
        headers: {
          Authorization: `Zoho-oauthtoken ${await zohoAuth.getAccessToken()}`,
          orgId: "20091741223",
          "Content-Type": "application/json",
        },
      };

      const callDepartments = await fetch(
        "https://desk.zoho.eu/api/v1/departments",
        optionsDepartment
      );
      const departmentJson = await callDepartments.json();

      // Create array with object
      // @propety departmentName
      // @property departmentId
      const departmentsId = departmentJson.data.map((department: any) => ({
        name: department.name,
        id: department.id,
      }));

      const timerSeconds = async (row: any) => {
        return new Promise((resolve, reject) => {
          setTimeout(async () => {
            const res = await uploadTicket(row);
            if (res) {
              resolve("resulto");
            }
          }, 100000);
        });
      };

      const uploadTicket = async (row: any) => {
        if (row["Brand name"] !== "STREETPADEL") {
          return;
        }

        const viaAllowed = ["Mail", "Closed Ticket"];
        if (!viaAllowed.includes(row["Via"])) {
          return;
        }

        // Search if ticket exist in our DB
        const search: any = await ticketModel.findOne({
          idTicket: row.Id,
        });

        // Solo sube lo que tiene adjuntos | BORRAR
        if (search?.comments?.attachments?.length < 1) {
          console.log("no attachments");
          return;
        }

        //If not exist upload to DB
        if (!search) {
          Object.assign(row, { idTicket: row["Id"] });
          delete row["Id"];
          const uploadNotFound = await ticketModel.create(row);
        }

        // Assign corresponding status
        switch (row["Status"]) {
          case "Closed" || "Solved":
            row["Status"] = "Resuelto ok";
            break;
          case "Hold" || "Pending":
            row["Status"] = "Pendiente Cliente";
            break;
          case "New" || "Open":
            row["Status"] = "En curso";
            break;
        }

        // Select department ID
        const department = departmentsId.find(
          (department: any) => department.name === "StreetPadel"
        ); /*row["Brand Name"]*/

        const dataTicket = {
          departmentId: department.id,
          subject: row["Subject"],
          contact: {
            firstName: row["Requester"].split(" ")[0],
            lastName: row["Requester"].split(" ")[1],
            email: row["Requester email"],
          },
          cf: {
            cf_tienda: row["Brand name"],
            cf_origen: "Zendesk",
          },
          channel: "Email",
          status: row["Status"],
          createdTime: new Date(row["Created at"]).toISOString(),
        };

        // If exist
        const optionsRequest = {
          method: "POST",
          headers: {
            Authorization: `Zoho-oauthtoken ${await zohoAuth.getAccessToken()}`,
            orgId: "20091741223",
            "Content-Type": "application/json",
          },
        };

        // Upload ticket
        const uploadTicket = await fetch(
          `https://desk.zoho.eu/api/v1/tickets`,
          { ...optionsRequest, body: JSON.stringify(dataTicket) }
        );

        const uploadTicketResponse = await uploadTicket.json();

        console.log(uploadTicketResponse);

        if (uploadTicketResponse?.errorCode) {
          console.log("ticket", uploadTicketResponse);
          await timerSeconds(row);
          return;
        }

        const updateIdTicket = await ticketModel.findOneAndUpdate(
          { idTicket: row["Id"] },
          {
            idZoho: uploadTicketResponse.id,
          }
        );

        return true;
      };

      const fileCSV = createReadStream(tempFilePath, "utf8");

      fileCSV
        .pipe(new CsvReadableStream({ asObject: true }))
        .on("data", async (row: any) => {
          // Depuration to not upload
          await uploadTicket(row);
          // search.comments?.forEach((comment: any) => {
          //   (async function () {
          //     const dataComments = {
          //       content: comment.html_body,
          //       contentType: "html",
          //     };

          //     const uploadMessage = await fetch(
          //       `https://desk.zoho.eu/api/v1/tickets/${uploadTicketResponse.id}/comments`,
          //       { ...optionsRequest, body: JSON.stringify(dataComments) }
          //     ).catch((err) => {
          //       console.log(err);
          //     });
          //   })();
          // });
        })
        .on("close", async () => {
          console.log("All uploaded.");
          unlink(tempFilePath);
        });

      res.status(200).send("Uploaded");
    } catch (err: any) {
      return res.status(500).send({
        msg: err.message,
      });
    }
  },
  uploadAttachments: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const { csv } = req.files as FileArray;
    const { tempFilePath } = csv as UploadedFile;
    try {
      const fileCSV = createReadStream(tempFilePath, "utf8");

      const timerSeconds = async (row: any, attachment: any, index: number) => {
        return new Promise((resolve, reject) => {
          setTimeout(async () => {
            const res = await uploadAttachment(row, attachment);
            if (res) {
              resolve("resulto");
            }
          }, 10000 * index);
        });
      };

      async function uploadAttachment(search: any, attachment: any) {
        const download = await downloadAttachment(
          attachment.content_url,
          `src/assets/tmp/${attachment.file_name}`
        );
        const formData = new FormData();
        formData.append(
          "file",
          fs.createReadStream(`src/assets/tmp/${attachment.file_name}`),
          attachment.file_name
        );
        try {
          const httpsAgent = new https.Agent({ keepAlive: true });
          const response = await axios.post(
            `https://desk.zoho.eu/api/v1/tickets/${search.idZoho}/attachments`,
            formData,
            {
              headers: {
                Authorization: `Zoho-oauthtoken ${await zohoAuth.getAccessToken()}`,
                orgId: "20091741223", // Change this to the appropriate file type
                'Content-Type': 'multipart/form-data'
              },
              httpsAgent: httpsAgent
            }
          );
          console.log("File uploaded successfully:", response.status);
        } catch (err) {
          console.log(err);
        }

        // await unlink(`src/assets/tmp/${attachment.file_name}`);

        return true;
      }

      fileCSV
        .pipe(new CsvReadableStream({ asObject: true }))
        .on("data", async (row: any) => {
          // Depuration to not upload
          if (row["Brand name"] !== "STREETPADEL") {
            return;
          }

          const viaAllowed = ["Mail", "Closed Ticket"];
          if (!viaAllowed.includes(row["Via"])) {
            return;
          }

          const search: any = await ticketModel.findOne({
            idTicket: row.Id,
          });

          // If ticket exist in DB
          if (search?.comments?.length > 0) {
            for (const comment of search?.comments) {
              // Validate if attachment exist
              if (comment?.attachments?.length > 1) {
                console.log(
                  `Subject: ${search.subject} - Id Zendesk: ${search.id} - Id Zoho: ${search.idZoho}`
                );
                // Iterate attachments
                for (const attachment of comment.attachments) {
                  await uploadAttachment(search, attachment);
                }
              }
            }
          }
        });

      res.status(200).send("attachment upload");
      next();
    } catch (err: any) {
      res.status(500).send({
        error: err.message,
      });
      next();
    }
  },
  uploadComments: async (req: Request, res: Response, next: NextFunction) => {
    const { csv } = req.files as FileArray;
    const { tempFilePath } = csv as UploadedFile;

    try {
      const fileCSV = createReadStream(tempFilePath, "utf8");

      fileCSV
        .pipe(new CsvReadableStream({ asObject: true }))
        .on("data", async (row: any) => {
          // Depuration to not upload
          if (row["Brand name"] !== "STREETPADEL") {
            return;
          }

          const viaAllowed = ["Mail", "Closed Ticket"];
          if (!viaAllowed.includes(row["Via"])) {
            return;
          }

          const search: any = await ticketModel.findOne({
            idTicket: row["Id"],
          });

          const timerSeconds = async (comment: any, index: number) => {
            return new Promise((resolve, reject) => {
              setTimeout(async () => {
                const res = await uploadComment(comment, index);
                if (res) {
                  resolve("resulto");
                }
              }, 50000 * index);
            });
          };

          const uploadComment = async (comment: any, index: number) => {
            const dataComments = {
              content:
                comment.html_body +
                `<div>Date: ${comment.created_at} - Order: ${index}</div>`,
              contentType: "html",
            };

            const uploadMessage = await fetch(
              `https://desk.zoho.eu/api/v1/tickets/${search.idZoho}/comments`,
              {
                method: "POST",
                headers: {
                  Authorization: `Zoho-oauthtoken ${await zohoAuth.getAccessToken()}`,
                  orgId: "20091741223",
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(dataComments),
              }
            );

            const jsonMessage = await uploadMessage.json();

            if (jsonMessage?.errorCode) {
              comment.html_body = comment.plain_body;
              await timerSeconds(comment, index);
              return;
            }

            return true;
          };

          search.comments?.forEach((comment: any, index: number) => {
            async function up() {
              await timerSeconds(comment, index);
            }
            up();
          });
        })
        .on("close", async () => {
          console.log("All uploaded.");
          unlink(tempFilePath);
        });

      res.status(200).send("subido");
    } catch (err: any) {
      res.status(500).send({
        msg: err.message,
      });
    }
  },
};

export default ticketsController;
