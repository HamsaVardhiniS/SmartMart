import { Request, Response, NextFunction } from "express";

export const checkPermission = (permission:string)=>{
 return (req:Request,res:Response,next:NextFunction)=>{

  const user = (req as any).user;

  if(!user) return res.status(401).json({error:"Unauthorized"});

  if(!user.permissions?.includes(permission)){
   return res.status(403).json({error:"Forbidden"});
  }

  next();
 };
};