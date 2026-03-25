import redis from "../config/redis";
import prisma from "../config/db";
import * as service from "../services/analytics.service";

export const startConsumer = async () => {

  const sub = redis.duplicate();

  await sub.subscribe(
    "pos.sale.created",
    "pos.sale.refunded",
    "inventory.stock.updated",
    "procurement.order.received",
    "hr.payroll.generated"
  );

  sub.on("message", async (channel: string, message: string) => {

    const event = JSON.parse(message);
    if (!event?.eventId || !event?.data) {
      return;
    }
    const exists = await prisma.event_log.findUnique({
      where:{event_id:event.eventId}
    });

    if (exists) return;

    try {

      if(channel==="pos.sale.created"){
        await service.updateSalesSummary({
          date: new Date(event.timestamp),
          revenue:event.data.netAmount,
          tax:event.data.taxAmount
        });

        for(const item of event.data.items){
          await service.updateProductSales({
            product_id:item.productId,
            branch_id:event.data.branchId,
            quantity:item.quantity,
            revenue:item.price*item.quantity
          });
        }
      }

      if(channel==="inventory.stock.updated"){
        await service.updateInventory({
          product_id: event.data.product_id,
          branch_id: event.data.branch_id,
          current_stock: event.data.current_stock,
          stock_value: event.data.stock_value
        });
      }

      if(channel==="procurement.order.received"){
        if(channel==="procurement.order.received"){

          for(const item of event.data.items){
            await service.updateSupplier({
              supplier_id: event.data.supplierId || 0, // fallback if missing
              branch_id: event.data.branchId,
              amount: item.cost * item.quantityReceived
            });
          }
        
        }
      }

      if(channel==="hr.payroll.generated"){
        await service.updatePayroll(event.data);
      }

      await prisma.event_log.create({
        data:{event_id:event.eventId}
      });

    } catch(err:any){
      await prisma.failed_events.create({
        data:{
          event_id:event.eventId,
          payload:event,
          error:err.message
        }
      });
    }
  });
};