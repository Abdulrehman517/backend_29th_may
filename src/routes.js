import { Router } from 'express';
import AuthController from './controllers/auth.js';
import DjsController from './controllers/dj.js';
import VenuesController from './controllers/venue.js';
import EventsController from './controllers/event.js';
import SettingsController from './controllers/setting.js';
import EntryTeamController from './controllers/entryTeam.js';
import PromotersController from './controllers/promoter.js';
import UserController from './controllers/user.js';
import PerformersController from './controllers/performer.js';
import EmailController from './controllers/Email.js';
import ChangeLogsController from './controllers/changeLog.js';

const router = Router();

// Authentication routes
router.post('/auth/login', AuthController.login);
router.get('/auth/validate', AuthController.validate);

// Account routes
router.get('/users', UserController.list);
router.post('/users', UserController.create);
router.get('/users/:id', UserController.getById);
router.delete('/users/:id', UserController.deleteById);
router.put('/users', UserController.updateById);

// DJ routes
router.get('/djs', DjsController.list);
router.get('/djs/ranks', DjsController.listRankwise);
router.get('/djs/deactivated', DjsController.listDeactivated);
router.get('/djs/listHistoryData', DjsController.getDjEventsHistoryData);
router.post('/djs', DjsController.create);
router.get('/djs/:id', DjsController.getById);
router.put('/djs', DjsController.updateById);
router.delete('/djs/:id', DjsController.deleteById);
router.get('/djs/history/:id/:type', DjsController.historyList);
router.post('/djs/updateFee', DjsController.updateFee);
router.post('/djs/updateBy', DjsController.updateBy);
router.post('/djs/updateNotes', DjsController.updateNotes);
router.post('/djs/guestsHistory', DjsController.addGuestHistory);
router.get('/djs/activate/:id', DjsController.activateDj);
router.get('/djs/recommended/:venue_id/:event_date', DjsController.listRecommended);

// Entry Team routes
router.get('/entry-team', EntryTeamController.list);
router.post('/entry-team', EntryTeamController.create);
router.get('/entry-team/:id', EntryTeamController.getById);
router.put('/entry-team', EntryTeamController.updateById);
router.delete('/entry-team/:id', EntryTeamController.deleteById);
router.get('/entry-team/history/:id/:type', EntryTeamController.Historylist);
router.get('/entry-team/getEntryTeamList/:id', EntryTeamController.getEntryTeamList);
router.post('/entry-team/addEntryTeamWithEvent', EntryTeamController.addEntryTeamWithEvent);

// Promoters routes
router.get('/promoters', PromotersController.list);
router.post('/promoters', PromotersController.create);
router.get('/promoters/listHistoryData', PromotersController.getPromoterEventsHistoryData);
router.get('/promoters/listEventPromoters', PromotersController.eventPromotersData);
router.get('/promoters/:id', PromotersController.getById);
router.put('/promoters', PromotersController.updateById);
router.delete('/promoters/:id', PromotersController.deleteById);
router.get('/promoters/events/:id', PromotersController.getEventsByPromoters);
router.post('/promoters/guestsHistory', PromotersController.addGuestHistory);
router.get('/promoters/history/:id/', PromotersController.Historylist);
router.get('/promoters/getPromoterList/:id', PromotersController.getPromoterList);
router.get('/promoters/history/:id/:type', PromotersController.PromoterEventHistorylist);

// Venue routes
router.get('/venues', VenuesController.list);
router.post('/venues', VenuesController.create);
router.get('/venues/:id', VenuesController.getById);
router.put('/venues', VenuesController.updateById);
router.delete('/venues/:id', VenuesController.deleteById);

// Event routes
router.get('/events/all/:type', EventsController.list);
router.post('/events', EventsController.create);
router.get('/events/allDetails/:id', EventsController.listRankwise);
router.get('/events/:id', EventsController.getById);
router.put('/events', EventsController.updateById);
router.delete('/events/:id', EventsController.deleteById);
router.post('/events/assigndj', EventsController.assignDj);
router.get('/events/bydjs/:id', EventsController.getEventByDj);
router.get('/events/creative/status/:id/:type/:status', EventsController.updateCreativeStatus);
router.post('/events/creative/upload', EventsController.uploadCreativeDesigns);
router.post('/events/creative/send', EventsController.sendCreativeEmail);
router.get('/events/creative/:id', EventsController.getCreativeDesign);

router.post('/events/updateEventBrite', EventsController.updateEventBrite);
router.get('/events/getEventBriteDetails/:id', EventsController.getEventBritDetails);
router.get('/events/getEventById/:id', EventsController.getOneEventById);

// Settings routes
router.get('/email/logs', EventsController.getEmailLogs);
router.get('/email/logs/dj/:id', EmailController.getEmailLogsByDj);
router.put('/email/logs/:id/:timeSetId', EventsController.updateEmailStatus);
router.post('/email', EmailController.create);
router.get('/email/:type', EmailController.getByType);

// Settings routes
router.get('/setting/fee', SettingsController.list);
router.post('/setting/fee', SettingsController.createFee);
router.get('/setting/users', SettingsController.listUser);
router.post('/setting/users', SettingsController.createUser);
router.delete('/settings/fee/:id', SettingsController.DeleteFeeById);
router.delete('/settings/user/:username', SettingsController.DeleteUserByName);
router.get('/setting/users-stats', SettingsController.getUserStats);
router.get('/setting/fee/suggested/:id', SettingsController.getSuggestedFee);

// Performer routes
router.post('/performers/updateById', PerformersController.eventPerformerUpdate);
router.get('/performers', PerformersController.list);
router.post('/performers', PerformersController.create);
router.get('/performers/:id', PerformersController.getById);
router.put('/performers', PerformersController.updateById);
router.delete('/performers/:id', PerformersController.deleteById);
router.get('/performers/history/:id/:type', PerformersController.PerformerEventHistorylist);
router.get('/performers/getPerformerList/:id', PerformersController.getPerformerList);
router.post('/performers/addPerformerWithEvent', PerformersController.addPerformerWithEvent);


// Change Logs routes

router.get('/change-logs', ChangeLogsController.getList)

export default router;
