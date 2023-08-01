import type { NextApiRequest, NextApiResponse } from 'next';
import { v2 as cloudinary } from 'cloudinary';
import { IncomingForm, File } from 'formidable';

cloudinary.config(process.env.CLOUDINARY_URL || '');

type Data = {
  message: string;
};
// Esto es para que no serialice lo que viene en el Body
export const config = {
  api: {
    bodyParser: false,
  },
};
// Api para subir las imagenes al servidor
export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  switch (req.method) {
    case 'POST':
      return UploadFile(req, res);

    default:
      res.status(400).json({ message: 'Bad Request' });
  }
}

const saveFile = async (file: File[]): Promise<string> => {
  const { secure_url } = await cloudinary.uploader.upload(file[0].filepath);
  return secure_url;
};

const parseFiles = async (req: NextApiRequest): Promise<string> => {
  //Solo procesa mi meticion no hay respuesta
  return new Promise((resolve, reject) => {
    const form = new IncomingForm();
    form.parse(req, async (err, fields, files) => {
      if (err) {
        return reject(err);
      }
      const filePath = await saveFile(files.file as File[]);
      resolve(filePath);
    });
  });
};

const UploadFile = async (req: NextApiRequest, res: NextApiResponse<Data>) => {
  //aca hacemos una funcion para parsear todo los archivos
  const imageUrl = await parseFiles(req);
  res.status(200).json({ message: imageUrl });
};
