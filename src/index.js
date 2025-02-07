import http from "http";
import RequestController from "./requestController.js";

const server = http.createServer((request, reponse) => {
  new RequestController(request, reponse).handleRequest();
});

server.listen(8080);
