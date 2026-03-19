import redis from "../config/redis";
import * as service from "../services/analytics.service";

export const startConsumer = ()=>{

 const sub = redis.duplicate();

 sub.subscribe("sale.completed");
 sub.subscribe("inventory.updated");
 sub.subscribe("payroll.generated");
 sub.subscribe("supplier.payment");

 sub.on("message",async(channel,message)=>{

  const data = JSON.parse(message);

  if(channel==="sale.completed"){

   await service.updateSalesSummary({
    date:new Date(),
    revenue:data.net_amount,
    tax:data.tax_amount
   });

   for(const item of data.items){
    await service.updateProductSales({
     product_id:item.product_id,
     branch_id:data.branch_id,
     quantity:item.quantity,
     revenue:item.total_price
    });
   }
  }

  if(channel==="inventory.updated"){
   await service.updateInventory(data);
  }

  if(channel==="payroll.generated"){
   await service.updatePayroll(data);
  }

  if(channel==="supplier.payment"){
   await service.updateSupplier(data);
  }

 });
};