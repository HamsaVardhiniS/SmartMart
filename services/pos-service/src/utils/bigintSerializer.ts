export const serializeBigInt = (data: any): any =>
  JSON.parse(
    JSON.stringify(data, (_, value) => {
      if (typeof value === "bigint") {
        return value.toString();
      }

      // 🔥 HANDLE Prisma Decimal
      if (value && typeof value === "object" && value.constructor?.name === "Decimal") {
        return value.toString();
      }

      return value;
    })
  );