const express = require("express");
const router = express.Router();

const wrapAsync = require("../util/wrapAsync.js");

const {
  isLoggedIn,
  isOwner,
  validateListing,
} = require("../middleware.js");

const listingController = require("../controllers/listings.js");

const multer = require("multer");
const { storage } = require("../cloudConfig.js");

const upload = multer({ storage });


// ================= INDEX (with SEARCH support) =================
router.get(
  "/",
  wrapAsync(listingController.index)
);


// ================= CREATE =================
router.post(
  "/",
  isLoggedIn,
  upload.single("listing[image]"),
  validateListing,
  wrapAsync(listingController.createListing)
);


// ================= NEW FORM =================
router.get(
  "/new",
  isLoggedIn,
  listingController.renderNewForm
);


// ================= EDIT =================
router.get(
  "/:id/edit",
  isLoggedIn,
  isOwner,
  wrapAsync(listingController.renderEditForm)
);


// ================= SHOW + UPDATE + DELETE =================
router
  .route("/:id")
  .get(
    wrapAsync(listingController.showListing)
  )
  .put(
    isLoggedIn,
    isOwner,
    upload.single("listing[image]"),
    validateListing,
    wrapAsync(listingController.updateListing)
  )
  .delete(
    isLoggedIn,
    isOwner,
    wrapAsync(listingController.destroyListing)
  );

module.exports = router;