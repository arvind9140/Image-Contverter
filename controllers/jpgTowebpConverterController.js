import sharp from "sharp";
import AWS from "aws-sdk";
import { responseData } from "../utils/otherfunction.js";

import fs from "fs";
import path from "path";
import cron from 'node-cron';


const s3 = new AWS.S3({
    accessKeyId: 'AKIA2UCA4ERU5F4PXB4G',
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
       
    }).promise()
    return response.then(async data => {
       return { status: true, data }
      
    }).catch(err => {
       return { status: false, err }
    })
  }
export const jpgTowebp = async(req,res) =>{

        try{
       
            let fileName =   req.files.params.name;
           let response = await uploadImagePhoto(req, fileName, "params");
      
           if(response.status)
           {
            const imageName = fileName.split('/').pop().replace('.jpg', ''); // Extract the image name from the path
            const pdfPath = `${imageName}.webp`;
               const localStorage = `uploads/${fileName}`;
               const s3Object = await s3.getObject({ Bucket:`converterimg`, Key:fileName }).promise();
               fs.writeFileSync(localStorage, s3Object.Body);

              
              sharp(localStorage)
              .toFormat('webp')
              .toFile(pdfPath)
              .then(async () => {
                const jpgBuffer = fs.readFileSync(pdfPath);
                let pdf = await uploadPdf(req,pdfPath, jpgBuffer);
                if(pdf.status)
                {
                responseData(res, "Image converted  successfully!", 200, true, "", pdf.data.Location);
                fs.unlinkSync(pdfPath);
                fs.unlinkSync(localStorage);
                }
                else{
                  res.send({pdf})
                }
              })

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





