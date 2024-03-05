import AWS from "aws-sdk";
import { responseData } from "../utils/otherfunction.js";
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
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
 

  const uploadPdf = async (req, pdfBytes,pdfPath ) => {
    let response = s3.upload({
       Bucket: `converterimg/pdf`,
       Key: pdfPath,
       Body: pdfBytes,
      //  ContentType: req.files[key].mimetype,
       ACL: 'public-read'
    }).promise()
    return response.then(async data => {
       return { status: true, data }
      
    }).catch(err => {
       return { status: false, err }
    })
  }


  
  

export const JpgTopdf = async(req,res ) => {
    try{
   
        let fileName =   req.files.params.name;
       let response = await uploadImagePhoto(req, fileName, "params");
  
       if(response.status)
       {
        const imageName = fileName.split('/').pop().replace('.jpg', ''); // Extract the image name from the path
        const pdfPath = `${imageName}.pdf`;
           const localStorage = `uploads/${fileName}`;
           const s3Object = await s3.getObject({ Bucket:`converterimg`, Key:fileName }).promise();
        
          fs.writeFileSync(localStorage, s3Object.Body);
           
           const imageContent = fs.readFileSync(localStorage);
           const pdfDoc = await PDFDocument.create();
           const page = pdfDoc.addPage();
           const image = await pdfDoc.embedJpg(imageContent);
          //  const { width, height } = image.scale(0.5);
           const pageWidth = page.getSize().width;
           const pageHeight = page.getSize().height;
           const imageWidth = image.width;
           const imageHeight = image.height;
           const xPos = (pageWidth - imageWidth) / 2;
           const yPos = (pageHeight - imageHeight) / 2;
           page.drawImage(image, {
            x: xPos,
            y: yPos,
            width: imageWidth,
            height: imageHeight,
      
           });
         
           const pdfBytes = await pdfDoc.save();
           fs.writeFileSync(pdfPath, pdfBytes);
           let pdf = await uploadPdf(req, pdfBytes, pdfPath);

          fs.unlinkSync(pdfPath);
          fs.unlinkSync(localStorage);
          if(pdf.status)
          {
          responseData(res, "Image converted to PDF successfully!", 200, true, "", pdf.data.Location);
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