import axios from "axios";
import { ProcessSteadfastInvoicesSchemaType } from "@repo/common/schemas/steadfast";
import { Steadfast } from "@repo/common/models/steadfast";
import { Invoice } from "@repo/common/models/invoice";
import { HTTPException } from "hono/http-exception";
import type { ResponseType } from "@repo/common/schemas/response";
import { InvoiceStatus } from "@repo/common/enums/invoice";
import mongoose from "mongoose";

const steadfastApi = axios.create({
  baseURL: process.env.STEADFAST_API_URL,
  headers: {
    "Api-Key": process.env.STEADFAST_API_KEY,
    "Secret-Key": process.env.STEADFAST_SECRET_KEY,
  },
});
enum NotificationType {
  DELIVERY_STATUS = "delivery_status",
  TRACKING_UPDATE = "tracking_update",
}

enum DeliveryStatus {
  PENDING = "pending",
  DELIVERED = "delivered",
  PARTIALLY_DELIVERED = "partial_delivered",
  CANCELLED = "cancelled",
  UNKNOWN = "unknown",
}

export interface SteadfastCallbackPayload {
  notification_type: NotificationType;
  consignment_id: string;
  invoice: string;
  cod_amount: number;
  status: DeliveryStatus;
  delivery_charge: number;
  tracking_message: string;
  updated_at: string;
}

export const processSteadfastInvoicesService = async (
  payload: ProcessSteadfastInvoicesSchemaType,
): Promise<ResponseType> => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const invoice = await Invoice.findOne({
      invoiceNumber: payload.invoice,
    }).lean();
    if (!invoice)
      throw new HTTPException(404, { message: "Invoice not found" });

    const steadfast = await Steadfast.findOne({
      invoice_number: invoice.invoiceNumber,
    });
    if (steadfast)
      throw new HTTPException(400, {
        message: "Steadfast order already exists",
      });

    const createPayload = {
      ...payload,
      recipient_name: (invoice?.customer?.name ||
        invoice?.shippingAddress?.name)!,
      recipient_phone: (invoice?.customer?.phone ||
        invoice?.shippingAddress?.phone)!,
      recipient_email: (invoice?.customer?.email ||
        invoice?.shippingAddress?.email)!,
      alternative_phone: invoice?.shippingAddress?.phone,
      recipient_address: [
        invoice?.shippingAddress?.address,
        invoice?.shippingAddress?.city,
      ].join(", "),
    };

    const { data } = await steadfastApi.post("/create_order", createPayload);

    console.log({ data });

    if (data.consignment) {
      const steadfast = (
        await Steadfast.create(
          [
            {
              invoice_number: invoice.invoiceNumber,
              consignment_id: data.consignment.id,
              tracking_code: data.consignment.tracking_code,
              status: data.consignment.status,
              ...createPayload,
              invoice: invoice._id,
            },
          ],
          { session },
        )
      )?.[0];

      await session.commitTransaction();
      return {
        status: 201,
        message: "Steadfast order created",
        timestamp: new Date().toISOString(),
        data: { steadfast: steadfast?.toObject() },
      };
    }

    throw new HTTPException(400, {
      message: "Failed to create Steadfast order",
    });
  } catch (error) {
    console.log({ error });
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

export const processSteadfastCallbackService = async (
  payload: SteadfastCallbackPayload,
): Promise<ResponseType> => {
  if (payload?.notification_type === NotificationType.DELIVERY_STATUS) {
    await Steadfast.updateOne(
      { consignment_id: payload.consignment_id },
      { $set: { status: payload.status } },
    );

    const invoice = await Invoice.findOne({
      invoiceNumber: payload.invoice,
    });
    if (!invoice) {
      throw new HTTPException(404, { message: "Invoice not found" });
    }

    let invoiceStatus = invoice?.status;
    switch (payload.status) {
      case DeliveryStatus.PENDING:
        invoiceStatus = InvoiceStatus.SHIPPED;
        break;
      case DeliveryStatus.PARTIALLY_DELIVERED:
        invoiceStatus = InvoiceStatus.DELIVERED;
        break;
      case DeliveryStatus.CANCELLED:
        invoiceStatus = InvoiceStatus.CANCELLED;
        break;
      default:
        invoiceStatus = invoice?.status;
        break;
    }

    invoice.status = invoiceStatus;

    await invoice.save();
  }

  return {
    status: 200,
    message: "Steadfast callback processed",
    timestamp: new Date().toISOString(),
  };
};

export const getSteadfastDeliveryStatusService = async (
  id?: string,
  invoice?: string,
  trackingCode?: string,
): Promise<ResponseType> => {
  const steadfast = await Steadfast.findOne({
    $or: [
      { consignment_id: id },
      { invoice_number: invoice },
      { tracking_code: trackingCode },
    ],
  });

  if (!steadfast) {
    throw new HTTPException(404, { message: "Parcel not found" });
  }

  let endpoint = "";
  if (id) endpoint = `/status_by_cid/${id}`;
  else if (invoice) endpoint = `/status_by_invoice/${invoice}`;
  else if (trackingCode) endpoint = `/status_by_trackingcode/${trackingCode}`;

  if (!endpoint) {
    throw new HTTPException(400, { message: "Invalid request" });
  }

  const { data } = await steadfastApi.get(endpoint);

  if (data.status !== steadfast?.status) {
    steadfast.status = data.status;
    await steadfast.save();
  }

  return {
    status: 200,
    message: "OK",
    timestamp: new Date().toISOString(),
    data: {
      data,
      steadfast: {
        ...steadfast.toObject(),
        status: data.status,
      },
    },
  };
};
