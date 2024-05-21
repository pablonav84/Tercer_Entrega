import { isValidObjectId } from "mongoose";
import { usuariosService } from "../services/usuarios.service.js";

  async function getUsuarios (req, res) {
    let usuarios = await usuariosService.getAllUsuarios();

    res.setHeader("Content-Type", "application/json");
    res.status(200).json({ usuarios });
  };

  async function getUsuariosDTO (req, res) {
    try {
      const usuariosDTO = await usuariosService.getUsersDTO();
      res.json(usuariosDTO);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

  async function getUsuarioById (req, res) {
    let { id } = req.params;
    if (!isValidObjectId(id)) {
      res.setHeader("Content-Type", "application/json");
      return res.status(400).json({ error: `Ingrese un id de MongoDB válido` });
    }

    let usuario = await usuariosService.getUsuarioById({ _id: id });

    if (!usuario) {
      res.setHeader("Content-Type", "application/json");
      return res
        .status(404)
        .json({
          error: `El ID ingresado no corresponde a un usuario existente`,
        });
    }

    res.setHeader("Content-Type", "application/json");
    res.status(200).json({ usuario });
  };

  async function create (req, res) {
    let { nombre, email } = req.body;
    if (!email) {
      res.setHeader("Content-Type", "application/json");
      return res.status(400).json({ error: `email es requerido` });
    }

    let existe;
    try {
      existe = await usuariosService.getUsuarioByEmail({ email });
    } catch (error) {
      console.log(error);
      res.setHeader("Content-Type", "application/json");
      return res.status(500).json({
        error: `Error inesperado en el servidor - Intente más tarde, o contacte a su administrador`,
        detalle: `${error.message}`,
      });
    }
    if (existe) {
      res.setHeader("Content-Type", "application/json");
      return res
        .status(400)
        .json({ error: `Ya existe un usuarios con email ${email}` });
    }

    try {
      let nuevoUsuario = await usuariosService.crearUsuario({ nombre, email });
      res.setHeader("Content-Type", "application/json");
      return res.status(200).json({ nuevoUsuario });
    } catch (error) {
      console.log(error);
      res.setHeader("Content-Type", "application/json");
      return res.status(500).json({
        error: `Error inesperado en el servidor - Intente más tarde, o contacte a su administrador`,
        detalle: `${error.message}`,
      });
    }
  };

  export default {getUsuarios, getUsuariosDTO, getUsuarioById, create}
