const { default: axios } = require("axios");
const Links = require("../model/Links");
const Users = require("../model/Users");
const { getDeviceInfo } = require("../utils/linkUtil");
const Clicks = require("../model/clicks");

const linksController = {
  create: async (request, response) => {
    const { campaign_title, original_url, category } = request.body;

    console.log(campaign_title,original_url,category,"yeah aa vya");
    

    try {
      const user = await Users.findById({ _id: request.user.id });

      const now = Date.now();

      const hasSubscription =
        user.subscription && user.subscription.status === "active";
      
      //console.log("Subscription",hasSubscription);
      const hasCredits = user.credits >= 1;

      //console.log("user ka credit",hasCredits);
      

      if (!hasSubscription && !hasCredits) {
        return response.status(400).json({
          message: "Insufficient credit balance",
        });
      }

      //console.log("yha k credit",hasCredits);
      
      
      const link = new Links({
        campaignTitle: campaign_title,
        originalUrl: original_url,
        category: category,
        user:
          request.user.role === "admin"
            ? request.user.id
            : request.user.adminId,
      });
      link.save();

      if (!hasSubscription) {
        user.credits -= 1;
        await user.save();
      }

      
        // user.credits -= 1;
        // await user.save();
      

      response.json({
        data: { linkId: link._id },
      });
    } catch (error) {
      console.log(error);
      response.status(500).json({
        error: "Internal server error",
      });
    }
  },

  getAll: async (request, response) => {
    try {
      const userId =
        request.user.role === "admin" ? request.user.id : request.user.adminId;
      const links = await Links.find({ user: userId }).sort({ createdAt: -1 });
      response.json({ data: links });
    } catch (error) {
      console.log(error);
      response.status(500).json({
        error: "Internal server error",
      });
    }
  },

  getById: async (request, response) => {
    try {
      const linkId = request.params.id;
      if (!linkId) {
        return response.status(401).json({ error: "Link ID is required" });
      }

      const link = await Links.findById(linkId);
      if (!link) {
        return response.status(404).json({ error: "LinkID does not exist" });
      }

      const userId =
        request.user.role === "admin" ? request.user.id : request.user.adminId;
      // Make sure the link indeed belong to the logged in user.
      if (link.user.toString() !== userId) {
        return response.status(403).json({
          error: "Unauthorized access",
        });
      }

      response.json({ data: link });
    } catch (error) {
      console.log(error);
      response.status(500).json({
        error: "Internal server error",
      });
    }
  },

  update: async (request, response) => {
    try {
      const linkId = request.params.id;
      if (!linkId) {
        return response.status(401).json({ error: "Link ID is required" });
      }

      let link = await Links.findById(linkId);
      if (!link) {
        return response.status(404).json({ error: "LinkID does not exist" });
      }

      const userId =
        request.user.role === "admin" ? request.user.id : request.user.adminId;
      // Make sure the link indeed belong to the logged in user.
      if (link.user.toString() !== userId) {
        return response.status(403).json({
          error: "Unauthorized access",
        });
      }

      const { campaign_title, original_url, category } = request.body;
      link = await Links.findByIdAndUpdate(
        linkId,
        {
          campaignTitle: campaign_title,
          originalUrl: original_url,
          category: category,
        },
        { new: true }
      ); // new: true flag makes sure mongodb returns updated data after the update operation

      // Return updated link data
      response.json({ data: link });
    } catch (error) {
      console.log(error);
      response.status(500).json({
        error: "Internal server error",
      });
    }
  },

  delete: async (request, response) => {
    try {
      const linkId = request.params.id;
      if (!linkId) {
        return response.status(401).json({ error: "Link ID is required" });
      }

      let link = await Links.findById(linkId);
      if (!link) {
        return response.status(404).json({ error: "LinkID does not exist" });
      }

      const userId =
        request.user.role === "admin" ? request.user.id : request.user.adminId;
      // Make sure the link indeed belong to the logged in user.
      if (link.user.toString() !== userId) {
        return response.status(403).json({
          error: "Unauthorized access",
        });
      }

      await link.deleteOne();
      response.json({ message: "Link deleted" });
    } catch (error) {
      console.log(error);
      response.status(500).json({
        error: "Internal server error",
      });
    }
  },

  redirect: async (request, response) => {
    try {
      const linkId = request.params.id;
      if (!linkId) {
        return response.status(401).json({ error: "Link ID is required" });
      }

      let link = await Links.findById(linkId);
      if (!link) {
        return response.status(404).json({ error: "LinkID does not exist" });
      }

      const isDevelopement=process.env.NODE_ENV==='developement';
      //headers["x-forwarded-for"] store the ip address
      const ipAddress=isDevelopement?"8.8.8.8":request.headers["x-forwarded-for"]?.split(',')[0] || request.socket.remoteAddress;

      const geoRsponse=await axios.get(`http://ip-api.com/json/${ipAddress}`);
      const{city,country,region,lat,lon,isp}=geoRsponse.data;

      const userAgent=request.headers['user-agent'] || "unknown";

      const{isMobile,browser}=getDeviceInfo(userAgent);
      const deviceType=isMobile?'Mobile':'Desktop';

      const referrer=request.get('Referrer') ||  null

      await Clicks.create({
        linkID:link._id,
        ip:ipAddress,
        city:city,
        country,
        region,
        latitude:lat,
        longitude:lon,
        isp,
        referrer:referrer,
        useAgent:userAgent,
        deviceType,
        browser,
        clickedAt:new Date()
      });

      link.clickCount += 1;
      await link.save();

      response.redirect(link.originalUrl);
    } catch (error) {
      console.log(error);
      response.status(500).json({
        error: "Internal server error",
      });
    }
  },

  analytics: async(request,response)=>{
    try {
        const {linkId,from,to}=request.query;

        const link= await Links.findById({_id:linkId});
        if(!link){
          return response.status(404).json({
            error:"Link not found"
          });
        }

        const userId=request.user.role==='admin'?request.user.id:request.user.adminId

        if(link.user.toString()!==userId){
          return response.status(403).json({
            error:"Unauthorized"
          })
        }

        const query={
          linkId:linkId
        };

        if(from && to){
          query.clickedAt={$gte:new Date(from),$lte: new Date(to)};
        }

        const data=await Clicks.find(query).sort({clickedAt:-1});

        response.json(data);


    } catch (error) {
      console.log(error);
      return response.status(500).json({
        message:"Internal server error"
      })
    }
  }
};

module.exports = linksController;
