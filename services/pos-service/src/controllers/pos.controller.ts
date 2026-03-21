import { Request, Response, NextFunction } from "express";
import * as service from "../services/pos.service";
import { serializeBigInt } from "../utils/bigint.serializer";

const handle =
  (fn: (req: Request) => Promise<any>) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await fn(req);
      res.json(serializeBigInt(result));
    } catch (err) {
      next(err);
    }
  };

/* SALES */

export const createSale = handle((req: Request) =>
  service.createSale(req.body)
);

export const getSale = handle((req: Request) =>
  service.getSale(Number(req.params.id))
);

export const cancelSale = handle((req: Request) =>
  service.cancelSale(Number(req.params.id))
);

/* PAYMENTS */

export const addPayment = handle((req: Request) =>
  service.addPayment(req.body)
);

/* REFUND */

export const processRefund = handle((req: Request) =>
  service.processRefund(req.body)
);

/* CUSTOMERS */

export const createCustomer = handle((req: Request) =>
  service.createCustomer(req.body)
);

export const getCustomer = handle((req: Request) =>
  service.getCustomer(Number(req.params.id))
);

export const updateCustomer = handle((req: Request) =>
  service.updateCustomer(Number(req.params.id), req.body)
);

export const customerSummary = handle((req: Request) =>
  service.customerLifetimeSummary(Number(req.params.id))
);

export const addFeedback = handle((req: Request) =>
  service.addFeedback(req.body)
);

export const customerHistory = handle((req: Request) =>
  service.customerHistory(Number(req.params.id))
);

/* ANALYTICS */

export const dailyRevenue = handle(() => service.dailyRevenue());

export const paymentBreakdown = handle(() => service.paymentBreakdown());

export const topProducts = handle(() => service.topProducts());