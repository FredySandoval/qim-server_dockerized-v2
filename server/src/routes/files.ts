import express, { Express, NextFunction, Request, Response} from "express";
const router = express.Router();

import lodash from 'lodash';

import { __dirname }  from '../helper.js';
import path from 'path';

import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';

type Document = {
    name: string;
    unique_name: string;
    file_extension: string;
    size: number;
    encoding: string;
    mimetype: string;
    md5: string;
};
type Post = {
    main_link: string;
    created_at: string;
    total_files: number;
    documents: Document;
};
type Data = {
    posts: Post[]
}
class LowWithLodash<T> extends Low<T> {
    chain: lodash.ExpChain<this['data']> = lodash.chain(this).get('data')
}

const index_file = path.join(__dirname, 'collections_index', 'index.json');


const index_adapter = new JSONFile(index_file);
const index_db = new LowWithLodash(index_adapter);

router.get('/', async (req:Request, res:Response)=>{
    
    await index_db.read();
    const file_post = index_db.chain.find({ main_link: req.query.main_link }).value();
    if (!file_post) return res.status(404).json({data: 'not found'});
    res.json({
        data: file_post
    })
});

export default router;