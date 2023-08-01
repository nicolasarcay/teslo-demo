import React, { ChangeEvent, FC, useEffect, useRef, useState } from 'react';
import { GetServerSideProps } from 'next';
import { AdminLayout } from '../../../components/layouts';
import { IProduct } from '../../../interfaces';
import {
  DriveFileRenameOutline,
  SaveOutlined,
  UploadOutlined,
} from '@mui/icons-material';
import { dbProducts } from '../../../database';
import {
  Box,
  Button,
  capitalize,
  Card,
  CardActions,
  CardMedia,
  Checkbox,
  Chip,
  Divider,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Grid,
  Radio,
  RadioGroup,
  TextField,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { tesloApi } from '../../../api';
import { Product } from '../../../models';
import { useRouter } from 'next/router';

const validTypes = ['shirts', 'pants', 'hoodies', 'hats'];
const validGender = ['men', 'women', 'kid', 'unisex'];
const validSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

interface FormData {
  _id?: string;
  description: string;
  images: string[];
  inStock: number;
  price: number;
  sizes: string[];
  slug: string;
  tags: string[];
  title: string;
  type: string;
  gender: string;
}

interface Props {
  product: IProduct;
}

const ProductAdminPage: FC<Props> = ({ product }) => {
  const router = useRouter();

  // Definimos la referencia al boton de carga de archivos
  const fileInputRef = useRef<HTMLInputElement>(null);

  // useState para setear el nuevo valor del tag
  const [newTagValue, setNewTagValue] = useState('');
  // useState para manejar el estado del submit
  const [isSaving, setIsSaving] = useState(false);
  // uso el useForm con sus funcionalidades
  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
    setValue,
    watch,
  } = useForm<FormData>({
    defaultValues: product,
  });
  //Este useEffect lo uso para estar pendiente del cambio en titulo para formar el slug
  useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      if (name === 'title') {
        const newSlug =
          value.title
            ?.trim()
            .replaceAll(' ', '_')
            .replaceAll("'", '')
            .toLowerCase() || '';
        //Aca seteo el slug segun el titulo en el input del slug
        setValue('slug', newSlug);
      }
    });
    //Aca destruyo el efecto para que no siga escuchando
    return () => subscription.unsubscribe();
  }, [watch, setValue]);

  // Realizo los cambios en los items de size del formulario
  const onChangeSize = (size: string) => {
    const currentSizes = getValues('sizes');
    // Aca si esta marcado y le hago click deja de estar seleccionado
    if (currentSizes.includes(size)) {
      return setValue(
        'sizes',
        currentSizes.filter(s => s !== size),
        //esto se usa para revalidar y que se actualice en el front
        { shouldValidate: true }
      );
    }
    // Aca seteo la talla elegida dentro del arreglo
    setValue('sizes', [...currentSizes, size], { shouldValidate: true });
  };

  // Esta funcion se ejecuta al apretar la barra espaciadora en el input del tag
  const onNewTag = () => {
    // aca limpio el nuevo tag y lo coloco en minusculas
    const newTag = newTagValue.trim().toLowerCase();
    // Aca seteo el input a vacio nuevamente
    setNewTagValue('');
    // Aca traigo el arreglo de tags que tengo en el getValues
    const currentTags = getValues('tags');
    // Constato de que el newtag no exista en el arreglo
    if (currentTags.includes(newTag)) {
      return;
    }
    // Agrago el newtag al arreglo original
    currentTags.push(newTag);
  };

  //utilizo para borrar el un tag ya agregado
  const onDeleteTag = (tag: string) => {
    //Tengo el valor de las tags, filtro por el value que tiene el tag, y devuelvo un arreglo sin ese tag
    const updatedTags = getValues('tags').filter(t => t !== tag);
    setValue('tags', updatedTags, { shouldValidate: true });
  };

  const onFilesSelected = async ({ target }: ChangeEvent<HTMLInputElement>) => {
    //Primero declaro que si no hay archivos no hago nada
    if (!target.files || target.files.length === 0) {
      return;
    }
    try {
      for (let file of target.files) {
        const formData = new FormData();
        formData.append('file', file);
        const { data } = await tesloApi.post<{ message: string }>(
          '/admin/upload',
          formData
        );
        setValue('images', [...getValues('images'), data.message], {
          shouldValidate: true,
        });
      }
    } catch (error) {}
  };

  //Funcion para borrar la imagen
  const onDeleteImage = (image: string) => {
    setValue(
      'images',
      getValues('images').filter(img => img !== image),
      { shouldValidate: true }
    );
  };

  //aca voy a manejar el submit del formulario
  const onSubmit = async (form: FormData) => {
    //Verifico que tenga dos imagenes cargadas
    if (form.images.length < 2) return alert('Mínimo 2 imágenes');
    // Seteo el isSaving en true para que no se realicen varios post cuando esta salvando el producto
    setIsSaving(true);

    try {
      const { data } = await tesloApi({
        url: '/admin/products',
        method: form._id ? 'PUT' : 'POST', //Evaluamos si tenemos o no un _id para saber si es un producto nuevo o la modificacion de uno existente
        data: form,
      });
      console.log({ data });
      if (!form._id) {
        //recargar el navegador luego de crear un producto llevandolo al detalle del producto
        router.replace(`/admin/products/${form.slug}`);
      } else {
        setIsSaving(false);
      }
    } catch (error) {
      console.log(error);
      setIsSaving(false);
    }
  };

  return (
    <AdminLayout
      title={'Producto'}
      subTitle={`Editando: ${product.title}`}
      icon={<DriveFileRenameOutline />}
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <Box display="flex" justifyContent="end" sx={{ mb: 1 }}>
          <Button
            color="secondary"
            startIcon={<SaveOutlined />}
            sx={{ width: '150px' }}
            type="submit"
            disabled={isSaving}
          >
            Guardar
          </Button>
        </Box>

        <Grid container spacing={2}>
          {/* Data */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="Título"
              variant="filled"
              fullWidth
              sx={{ mb: 1 }}
              {...register('title', {
                required: 'Este campo es requerido',
                minLength: { value: 2, message: 'Mínimo 2 caracteres' },
              })}
              error={!!errors.title}
              helperText={errors.title?.message}
            />

            <TextField
              label="Descripción"
              variant="filled"
              fullWidth
              multiline
              sx={{ mb: 1 }}
              {...register('description', {
                required: 'Este campo es requerido',
                minLength: { value: 2, message: 'Mínimo 2 caracteres' },
              })}
              error={!!errors.description}
              helperText={errors.description?.message}
            />

            <TextField
              label="Inventario"
              type="number"
              variant="filled"
              fullWidth
              sx={{ mb: 1 }}
              {...register('inStock', {
                required: 'Este campo es requerido',
                min: { value: 0, message: 'Valor minimo 0' },
              })}
              error={!!errors.inStock}
              helperText={errors.inStock?.message}
            />

            <TextField
              label="Precio"
              type="number"
              variant="filled"
              fullWidth
              sx={{ mb: 1 }}
              {...register('price', {
                required: 'Este campo es requerido',
                min: { value: 0, message: 'Valor minimo 0' },
              })}
              error={!!errors.price}
              helperText={errors.price?.message}
            />

            <Divider sx={{ my: 1 }} />

            <FormControl sx={{ mb: 1 }}>
              <FormLabel>Tipo</FormLabel>
              <RadioGroup
                row
                value={getValues('type')}
                onChange={({ target }) =>
                  setValue('type', target.value, { shouldValidate: true })
                }
              >
                {validTypes.map(option => (
                  <FormControlLabel
                    key={option}
                    value={option}
                    control={<Radio color="secondary" />}
                    label={capitalize(option)}
                  />
                ))}
              </RadioGroup>
            </FormControl>

            <FormControl sx={{ mb: 1 }}>
              <FormLabel>Género</FormLabel>
              <RadioGroup
                row
                value={getValues('gender')}
                onChange={({ target }) =>
                  setValue('gender', target.value, { shouldValidate: true })
                }
              >
                {validGender.map(option => (
                  <FormControlLabel
                    key={option}
                    value={option}
                    control={<Radio color="secondary" />}
                    label={capitalize(option)}
                  />
                ))}
              </RadioGroup>
            </FormControl>

            <FormGroup>
              <FormLabel>Tallas</FormLabel>
              {validSizes.map(size => (
                <FormControlLabel
                  key={size}
                  control={
                    <Checkbox checked={getValues('sizes').includes(size)} />
                  }
                  label={size}
                  onChange={() => onChangeSize(size)}
                />
              ))}
            </FormGroup>
          </Grid>

          {/* Tags e imagenes */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="Slug - URL"
              variant="filled"
              fullWidth
              sx={{ mb: 1 }}
              {...register('slug', {
                required: 'Este campo es requerido',
                validate: val =>
                  val.trim().includes(' ')
                    ? 'No puede haber espacios'
                    : undefined,
              })}
              error={!!errors.slug}
              helperText={errors.slug?.message}
            />

            <TextField
              label="Etiquetas"
              variant="filled"
              fullWidth
              sx={{ mb: 1 }}
              helperText="Presiona [spacebar] para agregar"
              value={newTagValue}
              onChange={({ target }) => setNewTagValue(target.value)}
              onKeyUp={({ code }) =>
                code === 'Space' ? onNewTag() : undefined
              }
            />

            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                listStyle: 'none',
                p: 0,
                m: 0,
              }}
              component="ul"
            >
              {getValues('tags').map(tag => {
                return (
                  <Chip
                    key={tag}
                    label={tag}
                    onDelete={() => onDeleteTag(tag)}
                    color="primary"
                    size="small"
                    sx={{ ml: 1, mt: 1 }}
                  />
                );
              })}
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box display="flex" flexDirection="column">
              <FormLabel sx={{ mb: 1 }}>Imágenes</FormLabel>
              <Button
                color="secondary"
                fullWidth
                startIcon={<UploadOutlined />}
                sx={{ mb: 3 }}
                // Simulo un click en el boton real de carga de archivos
                onClick={() => fileInputRef.current?.click()}
              >
                Cargar imagen
              </Button>
              {/* Este input es el que realmente va a cargar las imagenes.  */}
              <input
                type="file"
                multiple
                accept="image/png, image/webp, image/jpeg, image/gif"
                style={{ display: 'none' }}
                ref={fileInputRef}
                // Aca ejecuto el onChange para realizar la carga de imagenes
                onChange={onFilesSelected}
              />

              <Chip
                label="Es necesario al 2 imagenes"
                color="error"
                variant="outlined"
                sx={{
                  display: getValues('images').length < 2 ? 'flex' : 'none',
                }}
              />

              <Grid container spacing={2}>
                {getValues('images').map(img => (
                  <Grid item xs={4} sm={3} key={img}>
                    <Card>
                      <CardMedia
                        component="img"
                        className="fadeIn"
                        image={img}
                        alt={img}
                      />
                      <CardActions>
                        <Button
                          fullWidth
                          color="error"
                          onClick={() => onDeleteImage(img)}
                        >
                          Borrar
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Grid>
        </Grid>
      </form>
    </AdminLayout>
  );
};

// You should use getServerSideProps when:
// - Only if you need to pre-render a page whose data must be fetched at request time

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
  const { slug = '' } = query;

  let product: IProduct | null;

  if (slug === 'new') {
    //aca debo crear el producto
    const tempProduct = JSON.parse(JSON.stringify(new Product()));
    //borro el Id que crea este nuevo producto
    delete tempProduct._id;
    tempProduct.images = ['img1.jpg', 'img.jpg'];
    product = tempProduct;
  } else {
    product = await dbProducts.getProductBySlug(slug.toString());
  }

  if (!product) {
    return {
      redirect: {
        destination: '/admin/products',
        permanent: false,
      },
    };
  }

  return {
    props: {
      product,
    },
  };
};

export default ProductAdminPage;
