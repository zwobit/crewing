const keystone = require('keystone');
const sendEmail = require('../email-helper')('volunteer-mission-changed.jade');

const Volunteer = keystone.list('Volunteer');
const Mission = keystone.list('Mission');

/**
 * List all Missions
 */
exports.all = (req, res) => {
   Mission.model
      .find({})
      .sort('-start')
      .populate('crew', 'name')
      .populate('area')
      .exec((err, missions) => {
         if (err) return res.apiError(err.detail.errmsg);
         res.apiResponse({ missions });
      });
};

/**
 * Get Mission by ID
 */
exports.one = (req, res) => {
   Mission.model
      .findById(req.params.id, (err, mission) => {
         if (err) return res.apiError(err.detail.errmsg);
         if (!mission) return res.apiNotFound();
         res.apiResponse({ mission });
      });
};

/**
 * Create a Mission
 */
exports.create = (req, res) => {
   const mission = new Mission.model();

   mission.getUpdateHandler(req).process(req.body, (err) => {
      if (err) return res.apiError(err.detail.errmsg);
      res.apiResponse({ success: true });
   });
};

/**
 * Update a Missions Data
 */
exports.update = (req, res) => {
   const newData = req.body;

   Mission.model
      .findById(req.params.id, (err, mission) => {
         if (err) return res.apiError(err.detail.errmsg);
         if (!mission) return res.apiNotFound();

         const data = {};

         if (newData.crew) {
            const oldCrewIDs = mission.crew.map(a => a.volunteer.toString());
            const newCrewIDs = newData.crew.map(a => a.volunteer);

            data.removed = oldCrewIDs.filter(id => !newCrewIDs.includes(id));
            data.added = newCrewIDs.filter(id => !oldCrewIDs.includes(id));

            newData.crew // set the status of newly added volunteers on pending
               .filter(a => data.added.includes(a.volunteer))
               .forEach(a => a.status = 'pending');

            if (newData.start || newData.end) {
               data.unchanged = oldCrewIDs.filter(id => newCrewIDs.includes(id));
               newData.crew
                  .filter(a => a.status === 'yes')
                  .forEach(a => a.status = 'pending');
            }
         }

         mission.getUpdateHandler(req).process(newData, (err2) => {
            if (err2) return res.apiError(err2.detail.errmsg);

            if (data.removed || data.added || data.unchanged) {
               Volunteer.model
                  .find({})
                  .where('_id')
                  .in([].concat(data.added, data.removed, data.unchanged))
                  .exec((err3, volunteers) => {
                     const promises = volunteers.map((volunteer) => {
                        const values = {
                           name: volunteer.name.first,
                           mission: mission.name,
                           start: new Date(mission.start).toDateString(),
                           end: new Date(mission.end).toDateString(),
                        };

                        if (data.added.includes(volunteer.id)) {
                           values.reason = 'you\'ve been added to a mission';
                        }
                        else if (data.removed.includes(volunteer.id)) {
                           values.reason = 'you\'ve been removed from a mission';
                        }
                        else { // unchanged
                           values.reason = 'the date of a mission changed';
                        }

                        return sendEmail(volunteer.email, values.reason, values);
                     });

                     Promise.all(promises)
                        .then(() => res.apiResponse({ mission }))
                        .catch(() => res.apiError('saved data but couldn\'t send all emails'));
                  });
            }
            else res.apiResponse({ mission });
         });
      });
};
