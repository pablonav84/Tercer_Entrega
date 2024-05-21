import { isValidObjectId } from "mongoose";
import { carritosService } from "../services/carritos.service.js";
import { productosService } from "../services/productos.service.js";
import { usuariosService } from "../services/usuarios.service.js";
import Ticket from "../dao/models/ticketModelo.js";


export default class CarritosController {
  static getCart = async (req, res) => {
    let { cid } = req.params;
  if (!cid) {
    res.setHeader("Content-Type", "application/json");
    return res.status(400).json({ error: `Ingrese cid` });
  }

  if (!isValidObjectId(cid)) {
    res.setHeader("Content-Type", "application/json");
    return res
      .status(400)
      .json({ error: `Ingrese cidcon formato válido de MongoDB id` });
  }

  let carrito = await carritosService.getCartBy({ _id: cid });
  if (!carrito) {
    res.setHeader("Content-Type", "application/json");
    return res.status(400).json({ error: `Carrito inexistente: ${cid}` });
  }

  res.setHeader("Content-Type", "application/json");
  return res.status(200).json({ carrito });
  };

  static getProductToCart = async (req, res) => {
    let { cid, pid } = req.params;
  if (!cid || !pid) {
    res.setHeader("Content-Type", "application/json");
    return res.status(400).json({ error: `Ingrese cid y pid` });
  }

  if (!isValidObjectId(cid) || !isValidObjectId(pid)) {
    res.setHeader("Content-Type", "application/json");
    return res
      .status(400)
      .json({ error: `Ingrese cid / pid con formato válido de MongoDB id` });
  }

  let carrito = await carritosService.getCartBy({ _id: cid });

  if (!carrito) {
    res.setHeader("Content-Type", "application/json");
    return res.status(400).json({ error: `Carrito inexistente: ${cid}` });
  }

  let producto = await productosService.getProductoBy({ _id: pid });
  if (!producto) {
    res.setHeader("Content-Type", "application/json");
    return res.status(400).json({ error: `Producto inexistente: ${pid}` });
  }

  let indiceProducto = carrito.items.findIndex((p) => p.productId.equals(pid));
  if (indiceProducto !== -1) {
    carrito.items[indiceProducto].cantidad++;
  } else {
    carrito.items.push({ productId: pid, cantidad: 1 });
  }

  try {
    let resultado = await carritosService.updateCart(cid, carrito);
    if (resultado.modifiedCount > 0) {
      res.setHeader("Content-Type", "application/json");
      return res.status(200).json({ payload: "Carrito actualizado...!!!" });
    } else {
      res.setHeader("Content-Type", "application/json");
      return res.status(500).json({
        error: `Error inesperado en el servidor - Intente más tarde, o contacte a su administrador`,
      });
    }
  } catch (error) {
    console.log(error);
    res.setHeader("Content-Type", "application/json");
    return res.status(500).json({
      error: `Error inesperado en el servidor - Intente más tarde, o contacte a su administrador`,
      detalle: `${error.message}`,
    });
  }
  };

  static purchase = async (req, res) => {
    try {
        let carritoId = req.params.cid;
        let carrito = await carritosService.getCartsById(carritoId);
    console.log(carrito)
        let totalAmount = 0;
        let productosComprados = [];
        let productosSinStock = [];
    
        // Obtengo los datos del carrito (productos y cantidad), luego recorro el producto para extraer stock y precio
        // compruebo que exista stock disponible y agrego los productos en los arrays inicializados de acuerdo a su stock
        for (const item of carrito.items) {
          let productoId = item.productId;
          let cantidad = item.cantidad;
    
          let producto = await productosService.getProductoBy(productoId);
          console.log(producto)
          let stock = producto.stock;
          let price = producto.price;
    
          if (stock >= cantidad) {
            producto.stock -= cantidad;
            await producto.save();
    
            totalAmount += price * cantidad;
            productosComprados.push(item);
          } else {
            productosSinStock.push(item); 
          }
        }
    
    // Los productos que no tienen stock son devueltos al carrito
        carrito.items = productosSinStock;
        await carritosService.updateCart(carritoId, carrito);
    
        // Creo un code único para agregar al ticket con una longitud de 6 caracteres 
        function generateCode() {
          const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
          const codeLength = 6;
        
          let code = "";
          for (let i = 0; i < codeLength; i++) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            code += characters[randomIndex];
          }
          return code;
        }
        
        //Recorro el modelo de usuarios para obtener el email del usuario
        let usuario = await usuariosService.getUsuarioById({_id: req.user._id});
        let email = usuario.email;
    
        //Si hay productos con stock dentro del carrito se genera el ticket
        if (productosComprados.length > 0) {
          const ticketData = {
            code: generateCode(),
            created_at: new Date(),
            amount: totalAmount, 
            purchaser: email,
          };
    
          //Almaceno el ticket en la base de datos
          const newTicket = new Ticket(ticketData);
          console.log(newTicket);
          await newTicket.save();
    
          let message = `Compra finalizada exitosamente con código de compra: ${newTicket.code}`;
          if (productosSinStock.length > 0) {
            message += `. Algunos productos no tenían suficiente stock y no fueron agregados a su compra.`;
          }
    
          res.status(200).json({ message: message });
        } else {
          res.status(400).json({ message: "No hay productos en el carrito o stock disponible." });
        }
      } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Error al finalizar la compra" });
      }
  };
}