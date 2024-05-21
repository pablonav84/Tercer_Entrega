import mongoose from "mongoose"
import { config } from "../config/config.js"
export const connDB=mongoose.connect(config.MONGO_URL,{
    dbName: config.DB_NAME
})
console.log("DB Conectada")