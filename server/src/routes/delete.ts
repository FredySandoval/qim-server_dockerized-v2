import express, { Express, NextFunction, Request, Response } from "express";
const router = express.Router();

import lodash from 'lodash';
import { __dirname }  from '../helper.js';
import path from 'path';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';

import * as fs from "fs";

class LowWithLodash<T> extends Low<T> {
    chain: lodash.ExpChain<this['data']> = lodash.chain(this).get('data')
}

const index_file = path.join(__dirname, 'collections_index', 'index.json');


const index_adapter = new JSONFile(index_file);
const index_db = new LowWithLodash(index_adapter);

interface MyRequest extends Request {
  query: {
    unique_name : string[]
    main_link: string
  }
};
router.delete('/', async (req:MyRequest, res: Response) => {
  const is_valid_query = ['main_link', 'unique_name'].every( n => ( n in req.query) );
  if ( !is_valid_query) return res.status(400).json({ data: 'invalid query'})

  await index_db.read();
  const file_edit = index_db.chain.find({ main_link: req.query.main_link }).value();

  if ( typeof req.query.unique_name == 'string') req.query.unique_name = [req.query.unique_name]
  const removed = [];
  req.query.unique_name.forEach(element => {
    const file_index = lodash.findIndex(file_edit.documents, { unique_name: element })
    if (file_index !== -1 ) {
      const is_image = file_edit.documents[file_index].mimetype;
      removed.push(file_edit.documents.splice(file_index, 1)[0])
      const file_link = path.join(__dirname, 'files', element )
      try {
        fs.unlinkSync(file_link);
        const image_pattern = /^image\/(jpeg|jpg|png|gif|webp|avif|tiff|svg)$/;
        if ( image_pattern.test(is_image)) {
          const file_symlink = path.join(__dirname, 'images', element )
          const file_small = path.join(__dirname, 'images', element + '_small' )
          fs.unlinkSync(file_symlink);
          fs.unlinkSync(file_small);
        }
      } catch (err) {
        console.log(err);
      }
    };
  });

  file_edit.total_files = file_edit.documents.length;
  if (file_edit.total_files == 0 ) {
    const document_index = index_db.chain.findIndex({ main_link: req.query.main_link}).value();
    index_db.chain.pullAt(document_index).value();
    await index_db.write();
    return res.json({data: 'all removed'});
  }
  await index_db.write();
  res.json({ data: removed });
});

export default router;