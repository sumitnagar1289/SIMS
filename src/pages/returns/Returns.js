import React, { useState } from "react";
import { Context } from "../../context/ContextProvider";
import axios from "axios";
import { useEffect } from "react";
import { makeStyles } from "@material-ui/core";
import Notification from "../../Components/Notification";
import DownloadIcon from "@mui/icons-material/Download";
import {
  Grid,
  Paper,
  TableBody,
  TableRow,
  TableCell,
  Toolbar,
  InputAdornment,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  DialogActions,
  FormHelperText,
  IconButton,
} from "@mui/material";
import useTable from "../../Components/useTable";
import * as Yup from "yup";
import { Search } from "@mui/icons-material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ConfirmDialog from "../../Components/ConfirmDialog";
import { Form, Formik, useFormik } from "formik";
import moment from "moment";
import UpdateReturns from "./UpdateReturns";
import { useContext } from "react";
import { useMemo } from "react";
import ImportButton from "../../Components/importButton";
const Excel = require("exceljs");

const useStyles = makeStyles((theme) => ({
  pageContent: {
    padding: theme.spacing(3),
  },
  searchInput: {
    width: "75%",
  },
  customTitle: {
    margin: 0,
    padding: theme.spacing(2),
    backgroundColor: "#000000",

    color: theme.palette.common.white,
    textAlign: "center",
  },
}));

export default function Returns() {
  const returnsExcel = async () => {
    let reportData = [];

    for (let i = 0; i < returns.length; i++) {
      let item = returns[i];

      let obj = {
        Godown: item.godown == null ? null : item.godown.location,
        "Godown Capacity (In Quintals)": item.godown.capacityInQuintals,
        "Product Name": item.product.name,
        "Product Qty": item.quantity,
        "Product Price": item.product.price,
        "Returned By": item.returned_by,
        Reason: item.reason,
        "Delivery date": item.delivery_date,
        "Return Date": item.return_date,
        "Invoce Number": item.invoice.invoiceNo,
        "Bill Value": item.invoice.billValue,
        "Receipt Number": item.receipt_no,
      };

      reportData.push(obj);
    }

    let workbook = new Excel.Workbook();

    let keys = Object.keys(reportData[0]);

    let headers = getColumnHeaders(keys, keys);

    let columnHeaders = getExcelColumnHeaders(headers);

    let sheet = workbook.addWorksheet("Returns", {
      views: [{ state: "frozen", ySplit: 1 }],
    });

    console.log("Headers", headers, "Column Headers", columnHeaders);

    sheet.columns = columnHeaders;

    // add data to excel sheet
    sheet.addRows(reportData);

    // make the header bold
    sheet.getRow(1).font = { bold: true };

    let fileBuffer = await workbook.xlsx.writeBuffer();

    const fileBlob = new Blob([fileBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const fileName = `${"Returns"}_${new Date().toISOString()}.xlsx`;

    const url = URL.createObjectURL(fileBlob);

    let link = document.createElement("a");

    link.href = url;

    link.setAttribute("download", fileName);

    document.body.appendChild(link);

    link.click();

    URL.revokeObjectURL(url);
  };

  const getColumnHeaders = (columns, keys = []) => {
    const columnHeaders = [];
    for (let i = 0; i < columns.length; i++) {
      let currrentColumn = columns[i].trim();
      columnHeaders.push({
        header: currrentColumn,
        key: keys[i] ? keys[i] : currrentColumn,
      });
    }

    return columnHeaders;
  };

  const getExcelColumnHeaders = (headers) => {
    let columnHeaders = [];
    for (let i = 0; i < headers.length; i++) {
      columnHeaders.push({
        header: headers[i].header,
        key: headers[i].key,
        width:
          headers[i].header === "Message" ? 50 : headers[i].header.length + 10,
        style: {
          alignment: {
            vertical: "middle",
            horizontal: "center",
            wrapText: true,
          },
          bgColor: { argb: "#008000" },
        },
      });
    }

    return columnHeaders;
  };
  const headCells = useMemo(
    () => [
      { id: "godown", label: "Godown" },
      { id: "product_name", label: "Product name" },
      { id: "returned_by", label: "Returned by" },
      { id: "reason", label: "Reason" },
      { id: "delivery_date", label: "Delivery date" },
      { id: "return_date", label: "Return date" },
      { id: "invoice_no", label: "Invoice number" },
      { id: "receipt_no", label: "Receipt number" },
    ],
    []
  );

  const [user] = useContext(Context);

  useEffect(() => {
    if (user.role === "manager" && headCells.length == 8) {
      headCells.push({ id: "actions", label: "Actions", disableSorting: true });
    }
  }, [user.role]);

  const classes = useStyles();
  const [returns, setReturns] = useState(null);
  const [filterFn, setFilterFn] = useState({
    fn: (items) => {
      return items;
    },
  });
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    subTitle: "",
  });

  const [notify, setNotify] = useState({
    isOpen: false,
    message: "",
    type: "",
  });
  const [godowns, setGodowns] = useState([]);
  const [products, setProducts] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalItem, setEditModalItem] = useState(null);

  const { TblContainer, TblHead, TblPagination, recordsAfterPagingAndSorting } =
    useTable(returns, headCells, filterFn);

  const handleAddModalOpen = () => {
    setAddModalOpen(true);
  };
  const handleAddModalClose = () => {
    setAddModalOpen(false);
  };

  const handleEditModalOpen = (returns) => {
    setEditModalItem(returns);
  };
  const handleEditModalClose = () => {
    setEditModalItem(null);
    getData();
  };

  const handleSearch = (e) => {
    let target = e.target;
    setFilterFn({
      fn: (items) => {
        if (target.value === "") return items;
        else
          return items.filter((x) =>
            x.returned_by.toLowerCase().includes(target.value)
          );
      },
    });
  };

  const handleDelete = async (id) => {
    await axios
      .delete(`http://localhost:8080/api/returns/${id}`)
      .then((response) => {
        setNotify({
          isOpen: true,
          message: "Record deleted successfully",
          type: "success",
        });
        setReturns(returns.filter((record) => record.id !== id));
      })
      .catch((error) => {
        setNotify({
          isOpen: true,
          message: "Oops! An error occurred while performing this operation.",
          type: "error",
        });
        console.error({ data: error.response.data, status: error.response.status });
      });

    setConfirmDialog({
      ...confirmDialog,
      isOpen: false,
    });
  };

  const validationSchema = Yup.object().shape({
    godownId: Yup.number().required("Godown is required"),
    productId: Yup.number().required("Product is required"),
    quantity: Yup.number().required("Quantity is required"),
    returnedBy: Yup.string().required("This field is required"),
    deliveryDate: Yup.date().required("Delivery date is required"),
    reason: Yup.string().required("Reason is required"),
    returnDate: Yup.date().required("Return date is required"),
    receiptNo: Yup.number().required("Receipt number is required"),
    invoiceNo: Yup.string().required("Invoice number is required"),
    billCheckedById: Yup.number().required("This field is required"),
  });
  const formik = useFormik({
    initialValues: {
      godownId: null,
      productId: null,
      quantity: null,
      returnedBy: null,
      deliveryDate: null,
      returnDate: null,
      reason: null,
      receiptNo: null,
      invoiceNo: null,
      billCheckedById: null,
    },
    validationSchema: validationSchema,
    onSubmit: (values) => {
      let formData = {};
      formData["godown"] = {
        id: values.godownId,
      };
      formData["product"] = {
        id: values.productId,
      };
      formData["quantity"] = values.quantity;
      formData["returnedBy"] = values.returnedBy;
      formData["reason"] = values.reason;

      const deliveryDateObj = new Date(values.deliveryDate);
      const formattedDeliveryDate =
        moment(deliveryDateObj).format("DD/MM/YYYY");
      formData["deliveryDate"] = formattedDeliveryDate;

      const returnDateObj = new Date(values.returnDate);
      const formattedReturnDate = moment(returnDateObj).format("DD/MM/YYYY");
      formData["returnDate"] = formattedReturnDate;

      formData["receiptNo"] = values.receiptNo;
      formData["invoice"] = {
        invoiceNo: values.invoiceNo,
        billCheckedBy: {
          id: values.billCheckedById,
        },
      };

      console.log(formData);

      axios
        .post("http://localhost:8080/api/returns", formData)
        .then((response) => {
          handleAddModalClose();
          setNotify({
            isOpen: true,
            message: "Record submitted successfully",
            type: "success",
          });
          getData();
        })
        .catch((error) => {
          setNotify({
            isOpen: true,
            message: "Oops! An error occurred while performing this operation.",
            type: "error",
          });
          if (error.response.data.code === "UNIQUE_CONSTRAINT_VIOLATION") {
            const field = error.response.data.field.replace(/_([a-z])/g, g => g[1].toUpperCase());
            if (field === "receiptNo") {
              formik.setFieldError(field, "This receipt number already exists");
            }
            else if (field === "invoiceNo") {
              formik.setFieldError(field, "This invoice number already exists");
            }
          }
          console.error({ data: error.response.data, status: error.response.status });
        });
    },
  });

  function getData() {
    let returnsEndpoint = "http://localhost:8080/api/returns";

    if (user.role !== "superadmin") {
      returnsEndpoint = returnsEndpoint + `?godownId=${user.godown?.id}`;
    }

    axios
      .get(returnsEndpoint)
      .then((res) => {
        let rows = [];
        for (let i = 0; i < res.data.length; i++) {
          let item = res.data[i];
          let obj = {
            id: item.id,
            godown: item.godown,
            product: item.product,
            quantity: item.quantity,
            returned_by: item.returnedBy,
            reason: item.reason,
            delivery_date: item.deliveryDate,
            return_date: item.returnDate,
            invoice: item.invoice,
            receipt_no: item.receiptNo,
          };
          rows.push(obj);
        }
        rows.sort(
          (r1, r2) =>
            Date.parse(r1.delivery_date) - Date.parse(r2.delivery_date)
        );
        setReturns(rows);
      })
      .catch((error) => console.error({ data: error.response.data, status: error.response.status }));

    axios
      .get(`http://localhost:8080/api/godowns/${user.godown?.id}`)
      .then((res) => {
        setGodowns([res.data]);
      })
      .catch((error) => console.error({ data: error.response.data, status: error.response.status }));

    axios
      .get(`http://localhost:8080/api/products`) //?godownId=${user.godown?.id}`)
      .then((res) => {
        setProducts(res.data);
      })
      .catch((error) => console.error({ data: error.response.data, status: error.response.status }));

    axios
      .get(`http://localhost:8080/api/employees?godownId=${user.godown?.id}`)
      .then((res) => {
        setEmployees(res.data);
      })
      .catch((error) => console.error({ data: error.response.data, status: error.response.status }));
  }

  useEffect(() => {
    getData();
  }, []);

  useEffect(() => {
    if (!addModalOpen) {
      formik.resetForm();
    }
  }, [addModalOpen]);

  function toSentenceCase(str) {
    if (str === undefined || str === null) {
      return;
    }
    if (str.length === 1) {
      return str.toUpperCase();
    }
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  return (
    <>
      <Paper className={classes.pageContent}>
        <Toolbar>
          <Grid container spacing={2} direction="row">
            <Grid item>
              <TextField
                disabled={recordsAfterPagingAndSorting()?.length === 0}
                label="Search by supplier name"
                className={classes.searchInput}
                sx={{ width: "480px" }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
                onChange={handleSearch}
              />
            </Grid>
            <Grid item>
              <ImportButton getData={getData} setNotify={setNotify} tableId='returns' />
            </Grid>
            <Grid
              item
              style={{
                marginLeft: "auto",
                marginTop: "auto",
                marginBottom: "auto",
              }}
            >
              <IconButton color="success" onClick={returnsExcel}>
                <DownloadIcon />
              </IconButton>

              {user.role === "manager" && (
                <Button
                  variant="outlined"
                  sx={{ marginLeft: "8px" }}
                  startIcon={<AddIcon />}
                  className={classes.newButton}
                  onClick={handleAddModalOpen}
                >
                  Add new
                </Button>
              )}
            </Grid>
          </Grid>
        </Toolbar>
        {recordsAfterPagingAndSorting()?.length === 0 ? (
          <Grid sx={{ mt: 2, ml: 3 }}>
            There are currently 0 returns records.
          </Grid>
        ) : (
          <>
            <TblContainer>
              <TblHead />
              <TableBody>
                {recordsAfterPagingAndSorting()?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {item.godown.location}
                      <Typography
                        variant="caption"
                        color="textSecondary"
                        component="p"
                      >
                        {"Capacity: " + item.godown.capacityInQuintals}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {item.product.name}
                      <Typography
                        variant="caption"
                        color="textSecondary"
                        component="p"
                      >
                        {"Price: " + item.product.price}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="textSecondary"
                        component="p"
                      >
                        {"Quantity: " + item.quantity}
                      </Typography>
                    </TableCell>
                    <TableCell>{item.returned_by}</TableCell>
                    <TableCell>{toSentenceCase(item.reason)}</TableCell>
                    <TableCell>{item.delivery_date}</TableCell>
                    <TableCell>{item.return_date}</TableCell>
                    <TableCell>
                      {item.invoice.invoiceNo}
                      <Typography
                        variant="caption"
                        color="textSecondary"
                        component="p"
                      >
                        {"Bill value: " + item.invoice.billValue}
                      </Typography>
                    </TableCell>
                    <TableCell>{item.receipt_no}</TableCell>
                    {user.role === "manager" && (
                      <TableCell>
                        <Button onClick={() => handleEditModalOpen(item)}>
                          <EditIcon fontSize="small" />
                        </Button>
                        <Button
                          onClick={() => {
                            setConfirmDialog({
                              isOpen: true,
                              title: "Are you sure to delete this record?",
                              subTitle: "You can't undo this operation",
                              onConfirm: () => {
                                handleDelete(item.id);
                              },
                            });
                          }}
                        >
                          <DeleteIcon fontSize="small" color="error" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </TblContainer>
            <TblPagination />
          </>
        )}
      </Paper>

      <Dialog
        open={addModalOpen}
        onClose={handleAddModalClose}
        aria-labelledby="form-dialog-title"
      >
        <DialogTitle id="form-dialog-title" className={classes.customTitle}>
          Add returns
        </DialogTitle>
        <DialogContent>
          <Formik>
            {(formikProps) => (
              <Form onSubmit={formik.handleSubmit}>
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
                  <FormControl>
                    <InputLabel id="godownIdLabel">Godown</InputLabel>
                    <Select
                      labelId="godownIdLabel"
                      id="godownId"
                      label="Godown"
                      {...formik.getFieldProps("godownId")}
                      error={
                        formik.touched.godownId && formik.errors.godownId
                          ? true
                          : false
                      }
                    >
                      {godowns.map((godown, index) => (
                        <MenuItem key={index} value={godown.id}>
                          {godown.location}
                        </MenuItem>
                      ))}
                    </Select>
                    {formik.touched.godownId && formik.errors.godownId && (
                      <FormHelperText error>
                        {formik.touched.godownId && formik.errors.godownId}
                      </FormHelperText>
                    )}
                  </FormControl>
                  <FormControl>
                    <InputLabel id="productIdLabel">Product</InputLabel>
                    <Select
                      labelId="productIdLabel"
                      id="productId"
                      label="Product"
                      {...formik.getFieldProps("productId")}
                      error={
                        formik.touched.productId && formik.errors.productId
                          ? true
                          : false
                      }
                    >
                      {products.map((product, index) => (
                        <MenuItem key={index} value={product.id}>
                          {product.name}
                        </MenuItem>
                      ))}
                    </Select>
                    {formik.touched.productId && formik.errors.productId && (
                      <FormHelperText error>
                        {formik.touched.productId && formik.errors.productId}
                      </FormHelperText>
                    )}
                  </FormControl>
                  <TextField
                    id="quantity"
                    label="Quantity"
                    type="number"
                    inputProps={{ min: 1 }}
                    variant="outlined"
                    {...formik.getFieldProps("quantity")}
                    error={
                      formik.touched.quantity && formik.errors.quantity
                        ? true
                        : false
                    }
                    helperText={
                      formik.touched.quantity && formik.errors.quantity
                    }
                  />
                  <TextField
                    id="returnedBy"
                    label="Returned by"
                    type="text"
                    variant="outlined"
                    {...formik.getFieldProps("returnedBy")}
                    error={
                      formik.touched.returnedBy && formik.errors.returnedBy
                        ? true
                        : false
                    }
                    helperText={
                      formik.touched.returnedBy && formik.errors.returnedBy
                    }
                  />
                  <FormControl>
                    <InputLabel id="reasonIdLabel">Reason</InputLabel>
                    <Select
                      labelId="reasonIdLabel"
                      id="reasonId"
                      label="Reason"
                      {...formik.getFieldProps("reason")}
                      error={
                        formik.touched.reason && formik.errors.reason
                          ? true
                          : false
                      }
                    >
                      <MenuItem value="cancelled">Cancelled</MenuItem>
                      <MenuItem value="damaged">Damaged</MenuItem>
                    </Select>
                    {formik.touched.reason && formik.errors.reason && (
                      <FormHelperText error>
                        {formik.touched.reason && formik.errors.reason}
                      </FormHelperText>
                    )}
                  </FormControl>
                  <TextField
                    id="deliveryDate"
                    label="Delivery date"
                    type="date"
                    variant="outlined"
                    {...formik.getFieldProps("deliveryDate")}
                    error={
                      formik.touched.deliveryDate && formik.errors.deliveryDate
                        ? true
                        : false
                    }
                    helperText={
                      formik.touched.deliveryDate && formik.errors.deliveryDate
                    }
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                  <TextField
                    id="returnDate"
                    label="Return date"
                    type="date"
                    variant="outlined"
                    {...formik.getFieldProps("returnDate")}
                    error={
                      formik.touched.returnDate && formik.errors.returnDate
                        ? true
                        : false
                    }
                    helperText={
                      formik.touched.returnDate && formik.errors.returnDate
                    }
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                  <TextField
                    id="receiptNo"
                    label="Receipt number"
                    type="number"
                    inputProps={{ min: 1 }}
                    variant="outlined"
                    {...formik.getFieldProps("receiptNo")}
                    error={
                      formik.touched.receiptNo && formik.errors.receiptNo
                        ? true
                        : false
                    }
                    helperText={
                      formik.touched.receiptNo && formik.errors.receiptNo
                    }
                  />
                  <TextField
                    id="invoiceNo"
                    label="Invoice number"
                    type="text"
                    variant="outlined"
                    {...formik.getFieldProps("invoiceNo")}
                    error={
                      formik.touched.invoiceNo && formik.errors.invoiceNo
                        ? true
                        : false
                    }
                    helperText={
                      formik.touched.invoiceNo && formik.errors.invoiceNo
                    }
                    inputProps={{ maxLength: 12 }}
                  />
                  <FormControl>
                    <InputLabel id="billCheckedByIdLabel">
                      Bill checked by
                    </InputLabel>
                    <Select
                      labelId="billCheckedByIdLabel"
                      id="billCheckedById"
                      label="Bill checked by"
                      {...formik.getFieldProps("billCheckedById")}
                      error={
                        formik.touched.billCheckedById &&
                          formik.errors.billCheckedById
                          ? true
                          : false
                      }
                    >
                      {employees.map((employee, index) => (
                        <MenuItem key={index} value={employee.id}>
                          {employee.name}
                        </MenuItem>
                      ))}
                    </Select>
                    {formik.touched.billCheckedById &&
                      formik.errors.billCheckedById && (
                        <FormHelperText error>
                          {formik.touched.billCheckedById &&
                            formik.errors.billCheckedById}
                        </FormHelperText>
                      )}
                  </FormControl>
                </div>

                <DialogActions>
                  <Button
                    variant="outlined"
                    onClick={() => setAddModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    disabled={!formik.isValid || !formik.dirty}
                    type="submit"
                    variant="contained"
                    className={classes.actionButtons}
                  >
                    Add
                  </Button>
                </DialogActions>
              </Form>
            )}
          </Formik>
        </DialogContent>
      </Dialog>
      <Notification notify={notify} setNotify={setNotify} />

      <ConfirmDialog
        confirmDialog={confirmDialog}
        setConfirmDialog={setConfirmDialog}
      />

      <UpdateReturns
        returns={editModalItem}
        godowns={godowns}
        products={products}
        employees={employees}
        handleClose={handleEditModalClose}
      />
    </>
  );
}
