const Listing = require("../models/listing.js");
const axios = require("axios");

// ================= INDEX =================
module.exports.index = async (req, res) => {
  try {

    let filter = {};

    // CATEGORY FILTER
    if (req.query.category) {
      filter.category = req.query.category;
    }

    // SEARCH FILTER (FIXED SAFELY)
    if (req.query.search && req.query.search.trim() !== "") {

      const search = req.query.search.trim();

      filter.$or = [
        {
          title: {
            $regex: search,
            $options: "i",
          },
        },
        {
          location: {
            $regex: search,
            $options: "i",
          },
        },
        {
          country: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    const allListings = await Listing.find(filter);

    res.render("listings/index.ejs", {
      allListings,
      selectedCategory: req.query.category || null,
      search: req.query.search || "",
    });

  } catch (err) {
    console.log("Index Error:", err.message);
    req.flash("error", "Something went wrong while loading listings!");
    res.redirect("/");
  }
};


// ================= NEW FORM =================
module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};


// ================= SHOW =================
module.exports.showListing = async (req, res) => {
  try {

    let { id } = req.params;

    const listing = await Listing.findById(id)
      .populate({
        path: "reviews",
        populate: { path: "author" },
      })
      .populate("owner");

    if (!listing) {
      req.flash("error", "Listing not found!");
      return res.redirect("/listings");
    }

    res.render("listings/show.ejs", { listing });

  } catch (err) {
    console.log("Show Error:", err.message);
    req.flash("error", "Failed to load listing!");
    res.redirect("/listings");
  }
};


// ================= CREATE =================
module.exports.createListing = async (req, res) => {
  try {

    let coordinates = [77.2090, 28.6139];

    const location = req.body?.listing?.location;

    if (location && location.trim() !== "") {

      let url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(location)}&apiKey=${process.env.GEOAPIFY_API_KEY}`;

      let response = await axios.get(url);

      if (response.data?.features?.length > 0) {
        coordinates = response.data.features[0].geometry.coordinates;
      }
    }

    const newListing = new Listing(req.body.listing || {});

    newListing.owner = req.user._id;

    newListing.geometry = {
      type: "Point",
      coordinates,
    };

    if (req.file) {
      newListing.image = {
        url: req.file.path,
        filename: req.file.filename,
      };
    }

    await newListing.save();

    req.flash("success", "New Listing Created!");
    res.redirect("/listings");

  } catch (err) {
    console.log("Create Error:", err.message);
    req.flash("error", "Something went wrong while creating listing!");
    res.redirect("/listings");
  }
};


// ================= EDIT FORM =================
module.exports.renderEditForm = async (req, res) => {
  try {

    let { id } = req.params;

    const listing = await Listing.findById(id);

    if (!listing) {
      req.flash("error", "Listing not found!");
      return res.redirect("/listings");
    }

    let originalImageUrl = listing.image?.url || "";

    if (originalImageUrl) {
      originalImageUrl = originalImageUrl.replace(
        "/upload",
        "/upload/h_300,w_250"
      );
    }

    res.render("listings/edit.ejs", {
      listing,
      originalImageUrl,
    });

  } catch (err) {
    console.log("Edit Error:", err.message);
    req.flash("error", "Failed to load edit page!");
    res.redirect("/listings");
  }
};


// ================= UPDATE =================
module.exports.updateListing = async (req, res) => {
  try {

    let { id } = req.params;

    let listing = await Listing.findById(id);

    if (!listing) {
      req.flash("error", "Listing not found!");
      return res.redirect("/listings");
    }

    const location = req.body?.listing?.location;

    let coordinates =
      listing.geometry?.coordinates || [77.2090, 28.6139];

    if (location && location.trim() !== "") {

      let url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(location)}&apiKey=${process.env.GEOAPIFY_API_KEY}`;

      let response = await axios.get(url);

      if (response.data?.features?.length > 0) {
        coordinates = response.data.features[0].geometry.coordinates;
      }
    }

    Object.assign(listing, req.body.listing || {});

    listing.geometry = {
      type: "Point",
      coordinates,
    };

    if (req.file) {
      listing.image = {
        url: req.file.path,
        filename: req.file.filename,
      };
    }

    await listing.save();

    req.flash("success", "Listing Updated!");
    res.redirect(`/listings/${id}`);

  } catch (err) {
    console.log("Update Error:", err.message);
    req.flash("error", "Update failed!");
    res.redirect("/listings");
  }
};


// ================= DELETE =================
module.exports.destroyListing = async (req, res) => {
  try {

    let { id } = req.params;

    await Listing.findByIdAndDelete(id);

    req.flash("success", "Listing Deleted!");
    res.redirect("/listings");

  } catch (err) {
    console.log("Delete Error:", err.message);
    req.flash("error", "Delete failed!");
    res.redirect("/listings");
  }
};