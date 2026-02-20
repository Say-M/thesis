import axios, { AxiosInstance } from "axios";

interface SSLCommerzConfig {
  storeId: string;
  storePassword: string;
  baseUrl: string;
}

export enum ShippingMethod {
  YES = "YES",
  NO = "NO",
  COURIER = "Courier",
  SSLCOMMERZ_LOGISTIC = "SSLCOMMERZ_LOGISTIC",
}

export enum ProductProfile {
  GENERAL = "general",
  PHYSICAL_GOODS = "physical-goods",
  NON_PHYSICAL_GOODS = "non-physical-goods",
  AIRLINE_TICKETS = "airline-tickets",
  TRAVEL_VERTICAL = "travel-vertical",
  TELECOM_VERTICAL = "telecom-vertical",
}

interface PaymentRequestPayload {
  total_amount: number;
  currency: string;
  tran_id: string;
  success_url: string;
  fail_url: string;
  cancel_url: string;
  ipn_url: string;
  shipping_method: ShippingMethod;
  product_name: string;
  product_category: string;
  product_profile: ProductProfile;
  cus_name: string;
  cus_email: string;
  cus_add1?: string;
  cus_add2?: string;
  cus_city?: string;
  cus_state?: string;
  cus_postcode?: string;
  cus_country?: string;
  cus_phone?: string;
  cus_fax?: string;
  ship_name?: string;
  ship_add1?: string;
  ship_add2?: string;
  ship_city?: string;
  ship_state?: string;
  ship_postcode?: string;
  ship_country?: string;
  value_a?: string;
  value_b?: string;
  value_c?: string;
  value_d?: string;
}

interface PaymentResponsePayload {
  status: "SUCCESS" | "FAILED";
  failedreason: string;
  sessionkey: string;
  gw: PaymentGateways;
  redirectGatewayURL: string;
  directPaymentURLBank: string;
  directPaymentURLCard: string;
  directPaymentURL: string;
  redirectGatewayURLFailed: string;
  GatewayPageURL: string;
  storeBanner: string;
  storeLogo: string;
  desc: GatewayDescription[];
  is_direct_pay_enable: string;
}

interface PaymentGateways {
  visa: "dbbl_visa" | "brac_visa" | "city_visa" | "ebl_visa" | "visacard";
  master:
    | "dbbl_master"
    | "brac_master"
    | "city_master"
    | "ebl_master"
    | "mastercard";
  amex: "city_amex" | "amexcard";
  othercards: "dbbl_nexus" | "qcash" | "fastcash";
  internetbanking: "city" | "bankasia" | "ibbl" | "mtbl";
  mobilebanking: "dbblmobilebanking" | "bkash" | "abbank" | "ibbl";
}

interface GatewayDescription {
  name: string;
  type: string;
  logo: string;
  gw: string;
  r_flag?: string;
  redirectGatewayURL?: string;
}

interface RefundRequestPayload {
  refund_amount: number;
  refund_remarks: string;
  bank_tran_id: string;
  [key: string]: any;
}

class SSLCommerz {
  private axiosInstance: AxiosInstance;
  private config: SSLCommerzConfig;

  constructor(is_live = false) {
    this.config = {
      storeId: process.env.STORE_ID || "",
      storePassword: process.env.STORE_PASS || "",
      baseUrl: `https://${is_live ? "securepay" : "sandbox"}.sslcommerz.com`,
    };

    this.axiosInstance = axios.create({
      baseURL: this.config.baseUrl,
    });
  }

  /**
   * Initiates a payment session.
   */
  async createPaymentSession(
    payload: PaymentRequestPayload,
  ): Promise<PaymentResponsePayload> {
    try {
      const params = new URLSearchParams();

      for (const key in payload) {
        params.append(key, (payload as any)[key] || "");
      }

      params.append("store_id", this.config.storeId || "turfg673f5da01545e");
      params.append(
        "store_passwd",
        this.config.storePassword || "turfg673f5da01545e@ssl",
      );

      const { data }: { data: PaymentResponsePayload } =
        await this.axiosInstance.post(`/gwprocess/v4/api.php`, params, {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        });

      if (data.status === "FAILED") {
        throw new Error(data.failedreason);
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Validates a transaction.
   */
  async validateTransaction(tranId: string): Promise<any> {
    try {
      const response = await this.axiosInstance.get(
        `/validator/api/validationserverAPI.php`,
        {
          params: {
            val_id: tranId,
            store_id: this.config.storeId,
            store_passwd: this.config.storePassword,
            format: "json",
          },
        },
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Processes a refund.
   */
  async refundTransaction(payload: RefundRequestPayload): Promise<any> {
    try {
      const response = await this.axiosInstance.post(
        `/validator/api/merchantTransIDvalidationAPI.php`,
        {
          store_id: this.config.storeId,
          store_passwd: this.config.storePassword,
          ...payload,
        },
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

// Export a singleton instance of the client
const sslCommerz = new SSLCommerz(process.env.SSLCOMMERZ_LIVE === "true");
export default sslCommerz;
