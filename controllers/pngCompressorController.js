import sharp from "sharp";
import AWS from "aws-sdk";
import { responseData } from "../utils/otherfunction.js";

import fs from "fs";
import path from "path";
import cron from 'node-cron';


const s3 = new AWS.S3({
    accessKeyId: 'AKIAQPM52WHE7MFYMIX7',
    secretAccessKey: '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',
    region: "ap-south-1",
    s3BucketEndpoint: true,
    endpoint: "https://converterimg.s3.ap-south-1.amazonaws.com/"
 })

const uploadImagePhoto = async (req, fileName, key) => {
    let response = s3.upload({
       Bucket: `converterimg`,
       Key: fileName,
       Body: req.files[key].data,
       ContentType: req.files[key].mimetype,
       ACL: 'public-read'
    }).promise()
    return response.then(async data => {
       return { status: true, data }
    }).catch(err => {
       return { status: false, err }
    })
  }
  const deleteAllObjects = async () => {
   const listParams = { Bucket:'converterimg' };
   let isTruncated = true;
 
   while (isTruncated) {
     const { Contents, IsTruncated, NextContinuationToken } = await s3.listObjectsV2(listParams).promise();
 
     if (Contents.length > 0) {
       const deleteParams = {
         Bucket:'converterimg',
         Delete: { Objects: Contents.map(({ Key }) => ({ Key })) },
       };
 
       await s3.deleteObjects(deleteParams).promise();
     }
 
     isTruncated = IsTruncated;
     listParams.ContinuationToken = NextContinuationToken;
   }
 };
 

  const uploadPdf = async (req, pdfPath, jpgBuffer ) => {
    let response = s3.upload({
       Bucket: `converterimg/pdf`,
       Key: pdfPath,
       Body:jpgBuffer,
      //  ContentType: req.files[key].mimetype,
       ACL: 'public-read'
    }).promise()
    return response.then(async data => {
       return { status: true, data }
      
    }).catch(err => {
       return { status: false, err }
    })
  }
export const pngcompressor = async(req,res) =>{

        try{
       
            let fileName =   req.files.params.name;
           let response = await uploadImagePhoto(req, fileName, "params");
      
           if(response.status)
           {
            const imageName = fileName.split('/').pop().replace('.png', ''); // Extract the image name from the path
            const pdfPath = `${imageName}compressed.png`;
               const localStorage = `uploads/${fileName}`;
               const s3Object = await s3.getObject({ Bucket:`converterimg`, Key:fileName }).promise();
               fs.writeFileSync(localStorage, s3Object.Body);

               await sharp(localStorage)
      .png({ quality: 10, force: true })
      .toFile(pdfPath);
      const jpgBuffer = fs.readFileSync(pdfPath);
    console.log('PNG image compressed successfully!');
              let pdf = await uploadPdf(req,pdfPath, jpgBuffer);
              if(pdf.status)
              {
              responseData(res, "Image compressed  successfully!", 200, true, "", pdf.data.Location);
              fs.unlinkSync(pdfPath);
              fs.unlinkSync(localStorage);
              }
              else{
                res.send({pdf})
              }
           }
           else{
               res.send({response})
           }
           }
           catch (error) {
               res.send(error)
               console.log(error)
            }
        
          cron.schedule('0 0 * * *', async () => {
             try {
               await deleteAllObjects();
               console.log('All objects deleted from the S3 bucket.');
             } catch (error) {
               console.error('Error deleting objects:', error);
             }
           });
        
    }




