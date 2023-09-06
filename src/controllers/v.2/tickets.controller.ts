import { NextFunction, Request, Response } from "express";
import ticketModel from "../../models/tickets.model";
import { createReadStream, fstat, readFileSync, unlink } from "fs-extra";
import { FileArray, UploadedFile } from "express-fileupload";
import readline from "readline";
import CsvReadableStream from "csv-reader";
import zohoAuth from "../../utils/zoho/auth";
import FormData from "form-data";
import fetch from "node-fetch";
import path from "path";
import fs from "fs-extra";
import downloadAttachment from "../../utils/downloadAttachent";
import axios from "axios";
import https from "https";
import csvModel from "../../models/csv.model";

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
  upload: async (req: Request, res: Response, next: NextFunction) => {
    /*
     *  Request departments header
     */
    const optionsDepartment = {
      headers: {
        Authorization: `Zoho-oauthtoken ${await zohoAuth.getAccessToken()}`,
        orgId: "20091741223",
        "Content-Type": "application/json",
      },
    };

    /*
     * Request departments
     */
    const callDepartments = await fetch(
      "https://desk.zoho.eu/api/v1/departments",
      optionsDepartment
    );
    const departmentJson = await callDepartments.json();

    /*
     * map: Save all departments Id to assign to upload
     */
    const departmentsId = departmentJson.data.map((department: any) => ({
      name: department.name,
      id: department.id,
    }));

    try {
      /*
       *   Fetch CSV ticket from DB with specifications
       */
      const csvTickets: any = await csvModel
        .find({
          "Brand name": "STREETPADEL",
          Via: {
            $in: ["Mail", "Closed Ticket"],
          },
          // idCsv: {
          //   $in: [265201],
          // },
        })
        .lean()
        .exec();

      for (const row of csvTickets) {
        // if ((i / 50) % 2 === 0) {
        //   setTimeout(() => {
        //     console.log("Wait 5 seconds to continue...");
        //   }, 50000);
        // }

        /*
         * Search ticket of CSV in Json collection
         */
        const search: any = await ticketModel
          .findOne({
            idTicket: row.idCsv,
          })
          .lean()
          .exec();

        // Solo sube lo que tiene adjuntos | BORRAR
        if (
          !search?.hasOwnProperty("comments") ||
          search?.comments?.length < 1
        ) {
          console.log("no comments");
          continue;
        }

        /*
         * If ticket of CSV don't exist in json, add it on json collection
         */
        if (!search) {
          Object.assign(row, { idTicket: row["idCsv"] });
          delete row["idCsv"];
          await ticketModel.create(row);
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

        /*
         *   Select department id where we are going to upload ticket
         */
        const department = departmentsId.find(
          (department: any) => department.name === "Time2Padel-PadelMania"
        ); /*row["Brand Name"]*/

        /*
         * Object which is going to be sent in the request
         */
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

        /*
         *  Headers to upload request
         */
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

        // console.log(uploadTicketResponse);

        /*
         *   Update idZoho with upload response id
         *   Field necessary to compare if data is correctly upload
         */
        const updateIdTicket = await ticketModel.findOneAndUpdate(
          { idTicket: row.idCsv },
          {
            idZoho: uploadTicketResponse.id,
          }
        );

        if (
          search &&
          search?.hasOwnProperty("comments") &&
          search?.comments.length > 0
        ) {
          for (const [i, comment] of search.comments.entries()) {
            timerComments(i, comment, uploadTicketResponse.id);
          }
        }
      }

      function timerComments(i: number, comment: any, idTicket: any) {
        setTimeout(() => {
          uploadComment(i, comment, idTicket);
        }, i * 1000);
      }

      async function uploadComment(i: number, comment: any, idTicket: any) {
        const dataComments = {
          content:
            comment.html_body +
            `<div>Date: ${comment.created_at} - Order: ${i}</div>`,
          contentType: "html",
        };

        const uploadMessage = await fetch(
          `https://desk.zoho.eu/api/v1/tickets/${idTicket}/comments`,
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

        if (comment.attachments.length > 0) {
          for (const [i, attachment] of comment.attachments.entries()) {
            await timerAttachments(i, attachment, idTicket);
          }
        }
      }

      async function timerAttachments(
        i: number,
        attachment: any,
        idTicket: any
      ) {
        setTimeout(() => {
          uploadAttachment(i, attachment, idTicket);
        }, i * 1000);
      }

      async function uploadAttachment(
        i: number,
        attachment: any,
        idTicket: any
      ) {
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
            `https://desk.zoho.eu/api/v1/tickets/${idTicket}/attachments`,
            formData,
            {
              headers: {
                Authorization: `Zoho-oauthtoken ${await zohoAuth.getAccessToken()}`,
                orgId: "20091741223", // Change this to the appropriate file type
                "Content-Type": "multipart/form-data",
              },
              httpsAgent: httpsAgent,
            }
          );

          await unlink(`src/assets/tmp/${attachment.file_name}`);
        } catch (err) {
          console.log(err);
        }
      }

      res.status(200).send({
        msg: "Successfully executed",
      });
    } catch (err: any) {
      res.status(500).send({
        status: false,
        error: err.message,
      });
      return;
    }
  },
};

export default ticketsController;
