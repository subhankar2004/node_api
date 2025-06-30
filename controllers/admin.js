import {User} from "../models/user.model.js";
import { Return } from "../models/return.model.js";
import bcrypt from "bcrypt";
import { sendCookie } from "../utils/features.js";

export const adminRegistration=async(requestAnimationFrame,res)=>{
    try {
        const {name,email,password}=requestAnimationFrame.body;
        const user=await User.findOne({email});
        if(user){
            return res.status(404).json({
                success:false,
                message:"Admin Already Exists"
            })
        }
        const hashedPassword=await bcrypt.hash(password,10);
        const newUser=await User.create({
            name,
            email,
            password:hashedPassword,
            role:"admin" //implicit role
        })
        sendCookie(newUser,res,"Registered Successfully",201);
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success:false,
            message:"Internal Server Error"
        })
    }
}

export const adminLogin=async(req,res)=>{
    try {
        const {email,password}=req.body;
        const user=await User.findOne({email}).select("+password");
        if(!user){
            return res.status(404).json({
                success:false,
                message:"User Not Found"
            })
        };
        //password checking
        const isMatch=await bcrypt.compare(password,user.password);
        if(!isMatch){
            res.status(404).json({
                success:false,
                message:"Incorrect Password"
            })
        };
        if(isMatch){
            sendCookie(user,res,`Login Successfully,Welcome back ${user.name}`,200);
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success:false,
            message:"Internal Server Error"
        })
    }
}

export const getFilteredReturnRequests=async(req,res)=>{
    try {
        const {status,riskLevel,page,limit,sortBy="createdAt",order="desc"}=req.query;
        //we have to build a query object to filter the return orders
        const filter={}

        if(status){
            filter.status=status;
        }

        if(riskLevel){
            filter.riskLevel=riskLevel;
        }

        //calculating skip
        const skip = (page - 1) * limit;

        //Then We have to build a sor object
        const sortObj={};
        sortObj[sortBy]=order==="desc"?-1:1;

        //Now Executing the query
        const returns=await Return.find(filter)
        .populate('user','name email')
        .populate('order','totalAmount orderDate status items')
        
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit));

        // Get total count for pagination
        const totalReturns = await Return.countDocuments(filter);
        const totalPages = Math.ceil(totalReturns / limit);

        res.status(200).json({
            success: true,
            data: {
                returns,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalReturns,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                }
            }
        });


    } catch (error) {
        console.log(error);
        res.status(500).json({
            success:false,
            message:"Internal Server Error"
        })
    }
}

export const getDashboardStats=async(req,res)=>{
    try {
        const statusStats=await Return.aggregate([
            {$group:{
                _id:"$status",
                count:{$sum:1} //total count of status
            }}
        ]);

        //risk stats
        const riskStats=await Return.aggregate([
            {$group:{
                _id:"$riskLevel",
                count:{$sum:1}
            }}
        ]);

        // Get recent returns (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentReturnCounts=await Return.countDocuments({
            returnDate:{$gte:sevenDaysAgo}
        })

        const highRiskCounts=await Return.countDocuments({
            riskLevel:"High"
        })

        const pendingReviewsCount = await Return.countDocuments({
            status: "Pending Review"
        });

        const refundStats=await Return.aggregate([
            {
                $match: {
                    status: "Refunded",
                    refundAmount: { $gt: 0 }
                }
            },
            {
                $group:{
                    _id:null,
                    totalRefundReturns:{$sum:1}
                }
            }
        ])

        //console.log("Refund Stats:", refundStats);

        const statusCounts = {
            initiated: 0,
            pendingReview: 0,
            approved: 0,
            rejected: 0,
            refunded: 0
        };

        statusStats.forEach(stat=>{
            switch(stat._id){
                case "Initiated":
                    statusCounts.initiated = stat.count;
                    break;
                case "Pending Review":
                    statusCounts.pendingReview = stat.count;
                    break;
                case "Approved":
                    statusCounts.approved = stat.count;
                    break;
                case "Rejected":
                    statusCounts.rejected = stat.count;
                    break;
                case "Refunded":
                    statusCounts.refunded = stat.count;
                    break;
            }
        })

        const riskCounts = {
            low: 0,
            medium: 0,
            high: 0
        };

        riskStats.forEach(stat => {
            if (stat._id) {
                riskCounts[stat._id.toLowerCase()] = stat.count;
            }
        });

        //countin  total returns
        const totalReturns = await Return.countDocuments();

        res.status(200).json({
            success:true,
            dashboard:{
                overview:{
                    totalReturns,
                    pendingReviews:pendingReviewsCount,
                    highRishAlerts:highRiskCounts,
                    recentReturns:recentReturnCounts,
                },
                statusDistribution:statusCounts,
                riskDistribution:riskCounts,
                financials:{
                    totalRefund:refundStats[0]?.refundAmount || 0,
                    totalRefundedReturns: refundStats[0]?.totalRefundReturns || 0
                }

            }
        })

    } catch (error) {
        console.log(error);
        res.status(500).json({
            success:false,
            message:"Internal Server Error"
        })
    }
}

export const getFraudAlerts=async(req,res)=>{
    try {
        const { 
            page = 1, 
            limit = 20,
            sortBy = 'returnDate',
            order = 'desc',
            minScore,
            maxScore
        } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        //Building filter of high-risk returns
        const filter={
            $or:[
                {riskLevel:"High"},
                {finalScore:{$lt:0.3}},
                {
                    $and:[
                        {blurScore:{$lt:200}}, //Condition for Blury Image  
                        {finalScore:{$lt:0.5}}
                    
                    
                    ]
                }
            ]
        };

        if(minScore || maxScore){
            filter.finalScor={}; //Adding the score range filters
            if(minScore){
                filter.finalScore.$gte=parseFloat(minScore);
            }
            if(maxScore){
                filter.finalScore.$lte=parseFloat(maxScore);
            }
        }

        //Building The sort object
        const sortObj={}
        sortObj[sortBy]=order==="asc"?1:-1;

        const fraudAlerts = await Return.find(filter)
            .populate('user', 'name email createdAt')
            .populate('order', 'totalAmount orderDate status items')
            .sort(sortObj)
            .skip(skip)
            .limit(parseInt(limit));

        const totalFraudAlerts=await Return.countDocuments(filter);
        const totalPages=Math.ceil(totalFraudAlerts/limit);

        //Adding The fraud Indicator to each returns
        const fraudAlertWithIndicator=fraudAlerts.map(returnItem=>{
            const indicator=[];

            if(returnItem.riskLevel==="High"){
                indicator.push("High Risk Level , Contact to NearBy Wallmart offline store");
            }
            if(returnItem.riskLevel==="Medium"){
                indicator.push("Medium Risk Level ,Refund Will be initiated with some deductions");
            }
            if(returnItem.riskLevel==="Low"){
                indicator.push("Complete Refunds Will be initiated");
            }
            if (returnItem.finalScore < 0.3) {
                indicator.push("Very Low Final Score");
            }
            
            if (returnItem.blurScore < 200) {
                indicator.push("Blurry Image Detected");
            }
            
            if (returnItem.ssimScore < 0.5) {
                indicator.push("Poor Image Similarity");
            }
            
            if (returnItem.metadataScore < 0.4) {
                indicator.push("Suspicious Metadata");
            }

            return {
                ...returnItem.toObject(),
                fraudIndicator: indicator,
                alertLevel:returnItem.finalScore<0.2?"Critical":returnItem.finalScore<0.4?"High":"Medium"
            };

        });

    const criticalAlerts = fraudAlertWithIndicator.filter(alert => alert.alertLevel === "CRITICAL").length;
    const highAlerts = fraudAlertWithIndicator.filter(alert => alert.alertLevel === "HIGH").length;


    res.status(200).json({
        success: true,
        data:{
            fraudAlerts:fraudAlertWithIndicator,
            summary:{
                    totalFraudAlerts,
                    criticalAlerts,
                    highAlerts,
                    mediumAlerts: totalFraudAlerts - criticalAlerts - highAlerts
            },
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalFraudAlerts,
                hasNextPage: totalPages > parseInt(page),
                hasPreviousPage: parseInt(page) > 1
            }
        }
    })


    } catch (error) {
        console.log(error);
        res.status(500).json({
            success:false,
            message:"Internal Server Error"
        })
    }
}

export const logout=(req,res)=>{
    res.status(200).cookie("token","",{expires:new Date(Date.now())}).json({
        success:true,
        message:"Logout Successfully"
    })
}



export const getReturnById = async (req, res) => {
  try {
    const returnId = req.params.id;

    const returnRequest = await Return.findById(returnId)
      .populate("user", "name email")
      .populate("order"); // if you want order details

    if (!returnRequest) {
      return res.status(404).json({
        success: false,
        message: "Return request not found",
      });
    }

    res.status(200).json({
      success: true,
      return: returnRequest,
    });
  } catch (error) {
    console.error("Error in getReturnById:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

import qrcode from "qrcode";

export const updateReturnRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { riskLevel, action, refundAmount, status } = req.body;

    // Validate enum status input
    const validStatuses = ["Approved", "Rejected", "Refunded"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be one of: Approved, Rejected, Refunded",
      });
    }

    const returnRequest = await Return.findById(id);
    if (!returnRequest) {
      return res.status(404).json({
        success: false,
        message: "Return request not found",
      });
    }

    let message = "";
    let qrCodeUrl = "";

    if (riskLevel === "Low" && status === "Approved") {
      message = "✅ Your return is approved. Full refund will be processed soon.";
      qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=Refund:₹${refundAmount}`;
    } else if (riskLevel === "Medium" && status === "Approved") {
      message = "ℹ️ Partial refund initiated. If there's an issue, please visit your nearest Walmart warehouse.";
      qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=Partial Refund:₹${refundAmount}`;
    } else if (riskLevel === "High" && status === "Rejected") {
      message = "❌ Your return is flagged. Please visit the nearest Walmart store for manual inspection.";
    } else if (status === "Refunded") {
      message = "💸 Refund has been successfully completed.";
    } else {
      message = "⚠️ Action recorded. Please wait for further updates.";
    }

    returnRequest.status = status;
    returnRequest.refundAmount = refundAmount;
    returnRequest.adminMessage = message;

    await returnRequest.save();

    return res.status(200).json({
      success: true,
      message: "Return request updated successfully.",
      updatedStatus: status,
      refundAmount,
      userMessage: message,
      qrCodeUrl: qrCodeUrl || null,
    });

  } catch (error) {
    console.error("Error in updateReturnRequest:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
