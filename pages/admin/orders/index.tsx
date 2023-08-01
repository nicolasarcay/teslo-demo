import {
  ConfirmationNumberOutlined,
  CreditCardOffOutlined,
  CreditScoreOutlined,
} from '@mui/icons-material';
import { Chip, Grid } from '@mui/material';
import useSWR from 'swr';
import { AdminLayout } from '../../../components/layouts';
import { IOrder, IUser } from '../../../interfaces';
import { DataGrid, GridCellParams, GridColDef } from '@mui/x-data-grid';

const OrdersPage = () => {
  const { data, error } = useSWR<IOrder[]>('/api/admin/orders');

  if (!data && !error) return <></>;

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'Orden Id', width: 250 },
    { field: 'createdAt', headerName: 'Creada', width: 200 },
    { field: 'email', headerName: 'Correo', width: 200 },
    { field: 'name', headerName: 'Nombre Completo', width: 200 },
    { field: 'total', headerName: 'Monto Total', width: 100, align: 'right' },
    {
      field: 'isPaid',
      headerName: 'Estado',
      width: 150,
      renderCell: ({ row }: GridCellParams) => {
        return row.isPaid ? (
          <Chip
            sx={{
              my: 2,
              p: 1,
              height: 'auto',
              width: '125px',
              textAlign: 'center',
            }}
            label="Pagada"
            variant="outlined"
            color="success"
            icon={<CreditScoreOutlined />}
          />
        ) : (
          <Chip
            sx={{
              my: 2,
              p: 1,
              height: 'auto',
              width: '125px',
              textAlign: 'center',
            }}
            label="Pendiente"
            variant="outlined"
            color="error"
            icon={<CreditCardOffOutlined />}
          />
        );
      },
    },
    {
      field: 'numberOfItems',
      headerName: 'No.Productos',
      align: 'center',
      width: 150,
    },
    {
      field: 'check',
      headerName: 'Ver Orden',
      align: 'center',
      renderCell: ({ row }: GridCellParams) => {
        return (
          <a href={`/admin/orders/${row.id}`} target="_blank" rel="noreferrer">
            Ver Orden
          </a>
        );
      },
    },
  ];

  const rows = data!.map(order => ({
    id: order._id,
    createdAt: order.createdAt,
    email: (order.user as IUser).email,
    name: (order.user as IUser).name,
    total: order.total,
    isPaid: order.isPaid,
    numberOfItems: order.numberOfItems,
  }));

  return (
    <AdminLayout
      title={'Ordenes'}
      subTitle={'Mantenimiento de Ordenes'}
      icon={<ConfirmationNumberOutlined />}
    >
      <Grid container>
        <Grid item xs={12} sx={{ height: 650, width: '100%' }}>
          <DataGrid
            rows={rows}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10]}
          />
        </Grid>
      </Grid>
    </AdminLayout>
  );
};

export default OrdersPage;
