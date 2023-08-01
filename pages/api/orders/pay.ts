import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next';
import { IPaypal } from '../../../interfaces';
import { connect } from '../../../database/db';
import { db } from '../../../database';
import { Order } from '../../../models';

type Data = {
  message: string;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  switch (req.method) {
    case 'POST':
      return payOrder(req, res);

    default:
      res.status(400).json({ message: 'Bad Request' });
  }
}

const getPaypalToken = async (): Promise<string | null> => {
  const CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID;
  const PAYPAL_SECRET = process.env.PAYPAL_SECRET;
  const base64Token = Buffer.from(
    `${CLIENT_ID}:${PAYPAL_SECRET}`,
    'utf-8'
  ).toString('base64');
  const body = new URLSearchParams('grant_type=client_credentials');

  try {
    const { data } = await axios.post(
      process.env.PAYPAL_OAUTH_URL || '',
      body,
      {
        headers: {
          Authorization: `Basic ${base64Token}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    return data.access_token;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.log(error.response?.data);
    } else {
      console.log(error);
    }
    return null;
  }
};

const payOrder = async (req: NextApiRequest, res: NextApiResponse<Data>) => {
  const paypalToken = await getPaypalToken();

  if (!paypalToken) {
    return res
      .status(400)
      .json({ message: 'No se pudo confirmar el pago en paypal' });
  }

  const { transactionId = '', orderId = '' } = req.body;

  const { data } = await axios.get<IPaypal.PaypalOrderStatusResponse>(
    `${process.env.PAYPAL_ORDERS_URL}/${transactionId}`,
    {
      headers: {
        Authorization: `Bearer ${paypalToken}`,
      },
    }
  );
  // verifico que el status del pago sea completed
  if (data.status !== 'COMPLETED') {
    return res.status(401).json({ message: 'Orden no reconocida' });
  }

  db.connect();
  const dbOrder = await Order.findById(orderId);
  // verifico que la orden exista
  if (!orderId) {
    db.disconnect();
    return res
      .status(401)
      .json({ message: 'Orden no existe en nuestra base de datos' });
  }
  //verifico que el total abonado coincida con el total de la orden en la BD
  if (dbOrder!.total !== Number(data.purchase_units[0].amount.value)) {
    db.disconnect();
    return res.status(400).json({
      message:
        'Los montos no coinciden con los registros en nuestra base de datos',
    });
  }
  dbOrder!.transantionId = transactionId;
  dbOrder!.isPaid = true;
  await dbOrder!.save();

  await db.disconnect();

  return res.status(200).json({
    message: 'Orden pagada',
  });
};
