import { NextPage } from 'next';
import useSWR from 'swr';
import { AdminLayout } from '../../components/layouts';
import {
  AccessTimeOutlined,
  AttachMoneyOutlined,
  CancelPresentationOutlined,
  CategoryOutlined,
  CreditCardOffOutlined,
  CreditCardOutlined,
  DashboardOutlined,
  GroupOutlined,
} from '@mui/icons-material';
import { Grid, Typography } from '@mui/material';
import { IDashboardSummary } from '../../interfaces';
import SummaryTitle from '../../components/admin/SummaryTitle';
import { useEffect, useState } from 'react';

const DashboardPage: NextPage = () => {
  const { data, error } = useSWR<IDashboardSummary>('/api/admin/dashboard', {
    refreshInterval: 30 * 1000,
  });

  const [refreshIn, setRefreshIn] = useState(30);

  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshIn(refreshIn => (refreshIn > 0 ? refreshIn - 1 : 30));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!error && !data) {
    return <></>;
  }

  if (error) {
    return <Typography>Error al cargar la información {error}</Typography>;
  }

  const {
    numberOfOrders,
    paidOrders,
    notPaidOrders,
    numberOfClients,
    numberOfProducts,
    productsWithNoInventory,
    productsLowInventory,
  } = data!;

  return (
    <AdminLayout
      title="Dashboard"
      subTitle="Estadisticas Generales"
      icon={<DashboardOutlined />}
    >
      <Grid container spacing={2}>
        <SummaryTitle
          title={numberOfOrders}
          subTitle="Ordenes Totales"
          icon={<CreditCardOutlined color="secondary" sx={{ fontSize: 36 }} />}
        />
        <SummaryTitle
          title={paidOrders}
          subTitle="Ordenes Pagadas"
          icon={<AttachMoneyOutlined color="success" sx={{ fontSize: 36 }} />}
        />
        <SummaryTitle
          title={notPaidOrders}
          subTitle="Ordenes pendientes"
          icon={<CreditCardOffOutlined color="warning" sx={{ fontSize: 36 }} />}
        />
        <SummaryTitle
          title={numberOfClients}
          subTitle="Clientes"
          icon={<GroupOutlined color="primary" sx={{ fontSize: 36 }} />}
        />
        <SummaryTitle
          title={numberOfProducts}
          subTitle="Productos"
          icon={<CategoryOutlined color="warning" sx={{ fontSize: 36 }} />}
        />
        <SummaryTitle
          title={productsWithNoInventory}
          subTitle="Productos Agotados"
          icon={
            <CancelPresentationOutlined color="error" sx={{ fontSize: 36 }} />
          }
        />
        <SummaryTitle
          title={productsLowInventory}
          subTitle="Productos escasos"
          icon={<CreditCardOffOutlined color="warning" sx={{ fontSize: 36 }} />}
        />
        <SummaryTitle
          title={refreshIn}
          subTitle="Ordenes Totales"
          icon={<AccessTimeOutlined color="secondary" sx={{ fontSize: 36 }} />}
        />
      </Grid>
    </AdminLayout>
  );
};

export default DashboardPage;
