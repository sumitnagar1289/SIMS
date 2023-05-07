import React, { useState, useEffect } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import { makeStyles } from "@material-ui/core/styles";
import AddIcon from "@material-ui/icons/Add";
import axios from "axios";
import Box from "@material-ui/core/Box";
import * as Yup from "yup";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";

import {
  Card,
  CardContent,
  CardActions,
  IconButton,
  Grid,
  CardMedia,
  Typography,
} from "@mui/material";
import { useFormik } from "formik";
import UpdateProduct from "./UpdateProduct";

const useStyles = makeStyles((theme) => ({
  customTitle: {
    margin: 0,
    padding: theme.spacing(2),
    backgroundColor: "#000000",

    color: theme.palette.common.white,
    textAlign: "center",
  },
}));

function Products() {
  const classes = useStyles();

  const [products, setProducts] = useState([]);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalItem, setEditModalItem] = useState(null);

  useEffect(() => {
    getData();
  }, []);

  const getData = () => {
    axios
      .get("http://localhost:8080/api/products")
      .then((response) => {
        setProducts(response.data);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const handleAddModalOpen = () => {
    setAddModalOpen(true);
  };
  const handleAddModalClose = () => {
    setAddModalOpen(false);
  };

  const handleEditModalOpen = (product) => {
    setEditModalItem(product);
  };
  const handleEditModalClose = () => {
    setEditModalItem(null);
    getData();
  };

  const handleDelete = (id) => {
    axios
      .delete(`http://localhost:8080/api/products/${id}`)
      .then((response) => {
        setProducts(products.filter((product) => product.id !== id));
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const formik = useFormik({
    initialValues: {
      name: null,
      price: null,
      stock: null
    },
    validationSchema: Yup.object().shape({
      name: Yup.string().required("Name is required"),
      stock: Yup.number().required("Stock is required")
        .min(0, "Stock must be positive"),
      price: Yup.number().required("Price is required")
        .min(0, "Price must be positive"),
    }),
    onSubmit: values => {
      let formData = {};

      formData["name"] = values.name;
      formData["stock"] = values.stock;
      formData["price"] = values.price;

      console.log(formData);

      axios
        .post("http://localhost:8080/api/products", formData)
        .then((response) => {
          getData();
        })
        .catch((error) => {
          console.error(error);
        });

      handleAddModalClose();
    },
  });

  return (
    <div className="App">
      <Box display="flex" mb={2} justifyContent="flex-end">
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={handleAddModalOpen}
        >
          Add new
        </Button>
      </Box>

      <Dialog
        open={addModalOpen}
        onClose={handleAddModalClose}
        aria-labelledby="form-dialog-title"
      >
        <DialogTitle id="form-dialog-title" className={classes.customTitle}>
          Add a product
        </DialogTitle>
        <DialogContent>
          <form onSubmit={formik.handleSubmit}>
            <div
              style={{
                marginTop: "32px",
                marginBottom: "16px",
                display: "grid",
                gridTemplateColumns: "auto auto",
                columnGap: "16px",
                rowGap: "24px",
              }}
            >
              <TextField
                autoFocus
                id="name"
                label="Name"
                type="text"
                variant="outlined"
                {...formik.getFieldProps('name')}
                error={formik.touched.name && formik.errors.name ? true : false}
                helperText={formik.touched.name && formik.errors.name}
              />
              <TextField
                id="stock"
                label="Stock"
                type="number"
                variant="outlined"
                {...formik.getFieldProps('stock')}
                error={formik.touched.stock && formik.errors.stock ? true : false}
                helperText={formik.touched.stock && formik.errors.stock}
              />
              <TextField
                id="price"
                label="Price"
                type="number"
                variant="outlined"
                {...formik.getFieldProps('price')}
                error={formik.touched.price && formik.errors.price ? true : false}
                helperText={formik.touched.price && formik.errors.price}
              />
            </div>

            <DialogActions>
              <Button
                variant="outlined"
                onClick={() => setAddModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
              >
                Add
              </Button>
            </DialogActions>
          </form>
        </DialogContent>
      </Dialog>

      <Grid container spacing={6}>
        {products.map((product) => (
          <Grid item xs={12} sm={6} md={4} key={product.id}>
            <Card>
              <CardMedia
                style={{ height: "180px" }}
                component="img"
                image="https://www.cassidybros.ie/wp-content/uploads/2020/11/product-placeholder.jpg"
                title="product image"
              />
              <CardContent
                style={{
                  padding: "16px 24px",
                }}
              >
                <Typography
                  gutterBottom
                  style={{ fontWeight: "bold" }}
                  variant="h6"
                  component="h4"
                >
                  {product.name}
                </Typography>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "10px",
                  }}
                >
                  <div>
                    <Typography
                      variant="caption"
                      color="textSecondary"
                      component="p"
                    >
                      {"Stock:"}
                    </Typography>
                    <Typography variant="body2" component="p">
                      {product.stock}
                    </Typography>
                  </div>

                  <div>
                    <Typography
                      variant="caption"
                      color="textSecondary"
                      component="p"
                    >
                      {"Price:"}
                    </Typography>
                    <Typography variant="body2" component="p">
                      {product.price}
                    </Typography>
                  </div>
                </div>
              </CardContent>
              <CardActions
                style={{
                  padding: "16px 24px",
                }}
              >
                <IconButton
                  color="success"
                  aria-label="edit"
                  onClick={() => handleEditModalOpen(product)}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  color="error"
                  aria-label="delete"
                  onClick={() => handleDelete(product.id)}
                >
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <UpdateProduct
        product={editModalItem}
        handleClose={handleEditModalClose}
      />
    </div>
  );
}

export default Products;
