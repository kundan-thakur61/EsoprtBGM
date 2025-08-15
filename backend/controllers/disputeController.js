const Dispute = require('../models/disputeModel');

exports.createDispute = async (req, res) => {
  const { tournament, description } = req.body;
  const dispute = await Dispute.create({
    user: req.user._id,
    tournament,
    description
  });
  res.json(dispute);
};

exports.getDisputes = async (req, res) => {
  const disputes = await Dispute.find().populate('user', 'username').populate('tournament', 'name');
  res.json(disputes);
};

exports.updateDisputeStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const dispute = await Dispute.findByIdAndUpdate(id, { status }, { new: true });
  res.json(dispute);
};