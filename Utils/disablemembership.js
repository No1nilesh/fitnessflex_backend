const Member = require('../models/members');
const User = require('../models/User');

async function checkMembershipStatus() {
  // Find all members with an end_of_membership_date in the past
  const expiredMembers = await Member.find({ end_of_membership_date: { $lte: Date.now() } });
  const expiredUser = await User.find({ end_of_membership_date: { $lte: Date.now() } });
console.log("running")
  // Update the membership status of all expired members
  for (const member of expiredMembers) {
    member.membership_status = false;
    await member.save();
  }
  for (const user of expiredUser) {
    user.membership = false;
    await user.save();
  }
}

// Call the checkMembershipStatus function periodically
const mem_staus=()=>{

    setInterval(checkMembershipStatus, 24 * 60 * 60 * 1000); // Check once per day
}

module.exports = mem_staus