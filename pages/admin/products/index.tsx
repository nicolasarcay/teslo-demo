import { AddOutlined, CategoryOutlined } from '@mui/icons-material';
import { Box, Button, CardMedia, Grid, Link } from '@mui/material';
import useSWR from 'swr';
import { AdminLayout } from '../../../components/layouts';
import { IProduct } from '../../../interfaces';
import NextLink from 'next/link';
import {
  DataGrid,
  GridCellParams,
  GridColDef,
  GridColTypeDef,
} from '@mui/x-data-grid';

const ProductsPage = () => {
  const { data, error } = useSWR<IProduct[]>('/api/admin/products');

  if (!data && !error) return <></>;

  const moneyPrice: GridColTypeDef = {
    type: 'number',
    headerName: 'Precio',
    width: 130,
    valueFormatter: ({ value }) => formatCurrency(value),
  };

  const columns: GridColDef[] = [
    {
      field: 'images',
      headerName: 'Foto',
      renderCell: ({ row }: GridCellParams) => {
        console.log(row.img);
        return (
          <a href={`/product/${row.slug}`}>
            <CardMedia
              component="img"
              alt={row.title}
              className="fadeIn"
              image={row.img}
            />
          </a>
        );
      },
    },
    {
      field: 'title',
      headerName: 'Titulo',
      width: 300,
      renderCell: ({ row }: GridCellParams) => {
        return (
          <NextLink href={`./products/${row.slug}`} passHref legacyBehavior>
            <Link>{row.title}</Link>
          </NextLink>
        );
      },
    },
    { field: 'gender', headerName: 'Genero' },
    { field: 'type', headerName: 'Tipo' },
    {
      field: 'price',
      type: 'number',
      headerName: 'Precio',
      width: 130,
      valueFormatter: ({ value }) => formatCurrency(value),
    },
    { field: 'inStock', headerName: 'Inventario', align: 'center' },
    { field: 'sizes', headerName: 'Talles', width: 180 },
  ];

  function formatCurrency(value: number): string {
    // Formatea el valor numérico como moneda con 2 decimales
    return `$ ${value.toFixed(2)}`;
  }
  const rows = data!.map(product => ({
    id: product._id,
    img: product.images[0],
    title: product.title,
    gender: product.gender,
    type: product.type,
    inStock: product.inStock,
    price: product.price,
    sizes: product.sizes.join(', '),
    slug: product.slug,
  }));

  return (
    <AdminLayout
      title={`Productos (${data?.length})`}
      subTitle={'Mantenimiento de Productos'}
      icon={<CategoryOutlined />}
    >
      <Box display="flex" justifyContent="end" sx={{ mb: 2 }}>
        <Button
          color="secondary"
          startIcon={<AddOutlined />}
          href="/admin/products/new"
        >
          Nuevo Producto
        </Button>
      </Box>
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

export default ProductsPage;
