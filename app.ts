import dotenv from 'dotenv';
import "reflect-metadata";
import Server from './class/server';
import connectionDatabase from './database/connection';

dotenv.config();

const db = new connectionDatabase();
const server = new Server();

server.listen();