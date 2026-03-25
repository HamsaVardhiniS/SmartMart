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

  sub.on("message", async (channel, message) => {

    const event = JSON.parse(message);

    const exists = await prisma.event_log.findUnique({
      where:{event_id:event.eventId}
    });

    if (exists) return;

    try {

      if(channel==="pos.sale.created"){
        await service.updateSalesSummary({
          date:new Date(),
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
        await service.updateInventory(event.data);
      }

      if(channel==="procurement.order.received"){
        // update supplier summary
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