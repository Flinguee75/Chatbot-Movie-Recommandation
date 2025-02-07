import * as fs from "fs/promises";

import { getContentTypeFrom } from "./contentTypeUtil.js";

import { get_gpt_answer } from "./GPT.js";
import pkg from "pg";
const { Client } = pkg;
// Remplacez les valeurs par les informations de votre base de données
const BASE = "http://localhost/";

const client = new Client({
  host: "localhost",
  user: "postgres",
  port: 5432,
  password: "Nuage9231",
  database: "Chatbot",
});
client.connect();
/**
 *  define a controller to retrieve static resources
 */
export default class RequestController {
  #request;
  #response;
  #url;

  constructor(request, response) {
    (this.#request = request), (this.#response = response);
    this.#url = new URL(this.request.url, BASE).pathname; // on ne considère que le "pathname" de l'URL de la requête
  }

  get response() {
    return this.#response;
  }
  get request() {
    return this.#request;
  }
  get url() {
    return this.#url;
  }

  async handleRequest() {
    if (this.url === "/") {
      await this.buildResponseUrl("/index.html");
    } else if (this.url === "/test") {
      if (this.request.method === "POST") {
        // Récupérez le corps de la requête POST
        let body = "";
        this.request.on("data", (chunk) => {
          body += chunk;
        });

        // Une fois la requête POST entièrement reçue, traitez-la
        this.request.on("end", async () => {
          try {
            const requestData = JSON.parse(body);

            // Récupérez le message de l'utilisateur depuis la requête
            const userMessage = requestData.UserMessage;

            // Appelez votre fonction de test pour récupérer la réponse de l'API
            const apiResponse = await get_gpt_answer(userMessage);

            this.response.setHeader("Content-Type", "application/json");
            this.response.statusCode = 200;
            this.response.write(JSON.stringify({ result: apiResponse }));
          } catch (error) {
            this.response.statusCode = 400; // Erreur de la requête
            this.response.write("Bad Request");
          } finally {
            this.response.end();
          }
        });
      } else {
        // Si la méthode HTTP n'est pas POST, renvoyez une erreur
        this.response.statusCode = 405; // Méthode non autorisée
        this.response.write("Method Not Allowed");
        this.response.end();
      }
    } else if (this.url === "/feedback") {
      if (this.request.method === "POST") {
        // Récupérez le corps de la requête POST
        let body = "";
        this.request.on("data", (chunk) => {
          body += chunk;
        });

        // Une fois la requête POST entièrement reçue, traitez-la
        this.request.on("end", async () => {
          try {
            const requestData = JSON.parse(body);

            const commentaire = requestData.comment;
            const avis = requestData.aiReponduCorrectement;

            try {
              client.query(
                "INSERT INTO public.feedback(commentaire, ai_je_bien_repondu) VALUES($1, $2) RETURNING id",
                [commentaire, avis],
                (err, res) => {
                  if (!err) {
                    //console.log(res.rows);
                  } else {
                    //console.log(err.message);
                  }
                  client.end;
                }
              );

              // console.log(`Feedback inséré avec l'ID ${resultat.id}`);
            } catch (erreur) {
              // console.error("Erreur lors de l'insertion du feedback :", erreur);
            }

            this.response.setHeader("Content-Type", "application/json");
            this.response.statusCode = 200;
            this.response.write(JSON.stringify({ result: "nice" }));
          } catch (error) {
            this.response.statusCode = 400; // Erreur de la requête
            this.response.write("Bad Request");
          } finally {
            this.response.end();
          }
        });
      } else {
        // Si la méthode HTTP n'est pas POST, renvoyez une erreur
        this.response.statusCode = 405; // Méthode non autorisée
        this.response.write("Method Not Allowed");
        this.response.end();
      }
    } else {
      await this.buildResponseUrl(`${this.url}`);
    }
  }

  /**
   * send the requested resource as it is, if it exists, else responds with a 404
   */
  async buildResponseUrl(url) {
    this.response.setHeader("Content-Type", getContentTypeFrom(url));
    try {
      // check if resource is available
      //console.log(url);
      await fs.access(`.${url}`);
      // read the requested resource content
      const data = await fs.readFile(`.${url}`);
      // send resource content
      this.response.statusCode = 200;
      this.response.write(data);
    } catch (err) {
      // resource is not available
      this.response.statusCode = 404;
      this.response.write("erreur");
    }
    this.response.end();
  }
}
