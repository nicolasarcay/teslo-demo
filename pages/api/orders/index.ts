import type { NextApiRequest, NextApiResponse } from 'next';
import { IOrder } from '../../../interfaces';
import { getSession } from 'next-auth/react';
import { db } from '../../../database';
import { Order, Product } from '../../../models';

type Data = { message: string } | IOrder;

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  switch (req.method) {
    case 'POST':
      return createOrder(req, res);

    default:
      return res.status(400).json({ message: 'Bad request' });
  }
}

const createOrder = async (req: NextApiRequest, res: NextApiResponse<Data>) => {
  const { orderItems, total } = req.body as IOrder;

  // Verificar que tengamos un usuario
  const session: any = await getSession({ req });

  if (!session) {
    return res
      .status(401)
      .json({ message: 'Debe de estar autenticado para hacer esto' });
  }

  //Creamos un arreglo con los productos del carrito
  const productsIds = orderItems.map(product => product._id);

  await db.connect();

  const dbProducts = await Product.find({ _id: { $in: productsIds } });

  try {
    const subtotal = orderItems.reduce((prev, current) => {
      const currentPrice = dbProducts.find(
        prod => prod.id === current._id
      )?.price;
      if (!currentPrice) {
        throw new Error('Verifique el carrito de nuevo, producto no existe');
      }

      return currentPrice * current.quantity + prev;
    }, 0);
    const taxRate = Number(process.env.NEXT_PUBLIC_TAX_RATE || 0);
    const backendTotal = subtotal * (1 + taxRate);
    if (total !== backendTotal) {
      throw new Error(
        'El total no es igual a la suma de los productos solicitados'
      );
    }
    // Aca Generamos la orden porque hasta este punto viene siendo correcto
    const userId = session.user._id;
    const newOrder = new Order({ ...req.body, isPaid: false, user: userId });
    newOrder.total = Math.round(newOrder.total * 100) / 100;
    await newOrder.save();
    await db.disconnect();

    return res.status(201).json(newOrder);
  } catch (error: any) {
    await db.disconnect();
    res.status(400).json({
      message: error.message || 'Revise logs del servidor',
    });
  }

  return res.status(201).json(req.body);
};
