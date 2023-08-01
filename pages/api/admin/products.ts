import type { NextApiRequest, NextApiResponse } from 'next';
import { IProduct } from '../../../interfaces/products';
import { db } from '../../../database';
import { Product } from '../../../models';
import { isValidObjectId } from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config(process.env.CLOUDINARY_URL || '');

type Data = { message: string } | IProduct[] | IProduct;

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  switch (req.method) {
    case 'GET':
      return getProducts(req, res);

    case 'POST':
      return createProduct(req, res);

    case 'PUT':
      return updateProduct(req, res);

    default:
      return res.status(400).json({ message: 'Bad Request' });
  }
}

// Funcion para obtener todos los productos en la BD
const getProducts = async (req: NextApiRequest, res: NextApiResponse<Data>) => {
  await db.connect();

  const products = await Product.find().sort({ title: 'asc' }).lean();

  await db.disconnect();

  // TODO: tenemos que actualizar las imagenes
  const updatedProducts = products.map(product => {
    product.images = product.images.map(image => {
      return image.includes('http')
        ? image
        : `${process.env.HOST_NAME}products/${image}`;
    });
    return product;
  });

  res.status(200).json(updatedProducts);
};

// funcion para grabar la actualizacion del producto en la BD
const updateProduct = async (
  req: NextApiRequest,
  res: NextApiResponse<Data>
) => {
  const { _id = '', images = [] } = req.body as IProduct;

  if (!isValidObjectId(_id)) {
    return res.status(400).json({ message: 'No es un id valido' });
  }

  if (images.length < 2) {
    return res
      .status(400)
      .json({ message: 'Al menos debe contener 2 imagenes' });
  }

  //TODO: posiblemente tendremos un localhost:3000/products/image.jpg

  try {
    await db.connect();

    const product = await Product.findById(_id);
    if (!product) {
      await db.disconnect();
      return res
        .status(400)
        .json({ message: 'No existe un producto con ese id' });
    }
    // Aca eliminamos la imagen de cloudinary
    // Hacemos un foreach de las imagenes que trae el product que ya buscamos por _id
    product.images.forEach(async image => {
      // Vamos a ver que imagenes no estan incluidas en el nuevo arreglo
      if (!images.includes(image)) {
        // extraemos el el id de la foto de cloudinary que viene en la url de la imagen
        const [fileID, extension] = image
          .substring(image.lastIndexOf('/') + 1)
          .split('.'); // solicitamos que busque el ultimo "/" y al agregar uno se mueve hacia la derecha un espacio, con eso eliminamos tambien el "/", con el split genero un arreglo, con el primer dato el id y el segundo la extension del archivo
        //Borramos de cloudinary
        await cloudinary.uploader.destroy(fileID);
      }
    });

    await product.update(req.body);
    await db.disconnect();

    return res.status(200).json(product);
  } catch (error) {
    console.log(error);
    await db.disconnect();
    return res.status(400).json({ message: 'Revisar consola del servidor' });
  }
};

// Funcion para crear un nuevo producto en la BD

const createProduct = async (
  req: NextApiRequest,
  res: NextApiResponse<Data>
) => {
  const { images = [] } = req.body as IProduct;
  // Verificamos que tenga al menos dos imagenes
  if (images.length < 2) {
    return res
      .status(400)
      .json({ message: 'Al menos debe contener 2 imagenes' });
  }
  //TODO: posiblemente tendremos un localhost:3000/products/image.jpg
  try {
    await db.connect();
    // creamos una constante para verificar si existe un slug igual en la BD
    const productInDB = await Product.findOne({ slug: req.body.slug });
    if (productInDB) {
      await db.disconnect();
      return res.status(400).json({
        message: 'Slug ya existe en la base de datos, por favor moficiarlo',
      });
    }

    const product = new Product(req.body);
    // grabamos el producto en la BD
    await product.save();
    await db.disconnect();

    res.status(201).json(product);
  } catch (error) {
    console.log(error);
    await db.disconnect();
    return res.status(400).json({ message: 'Revisar consola del servidor' });
  }
};
