import {Router} from "express";
import {
    createPlanification,
    getAllPlanifications,
    getPlanificationById,
    updatePlanification
} from "../controllers/planificationController";
import {
    createProject,
    deleteProject,
    getAllProjects,
    getProject,
    updateProject} from "../controllers/projectController";
import {
    createTransaction,
    deleteTransaction,
    getAllTransactions,
    getTransactionById,
    updateTransaction
} from "../controllers/transactionsController";
import {
    createControlSheet,
    deleteControlSheet,
    getAllControlSheets,
    getControlSheetById,
    updateControlSheet
} from "../controllers/controlSheetController";
import projectAccess from "../middleware/projectAccess.middle";

const router = Router();

// CRUD routes for Project
router.post('/projects', createProject); // Create project
router.get('/projects', getAllProjects); // Get all projects
router.get('/projects/:projectId', getProject); // Get single project
router.put('/projects/:projectId', updateProject); // Update project
// router.delete('/projects/:projectId', deleteProject); // Delete project

// Routes for planifications
router.get('/planifications', projectAccess, getAllPlanifications); // Get planifications by project ID
router.get('/planifications/:planificationId', getPlanificationById); // Get planification by ID
router.post('/planifications', createPlanification); // Create planification week
router.put('/planifications/:planificationId', updatePlanification); // Update planification week

// CRUD routes for Control Sheet
router.post('/controlSheets', projectAccess, createControlSheet);
router.get('/controlSheets', getAllControlSheets);
router.get('/controlSheets/:controlSheetId', getControlSheetById);
router.put('/controlSheets/:controlSheetId', updateControlSheet);
router.delete('/controlSheets/:controlSheetId', deleteControlSheet);

// CRUD routes for Transactions
router.post('/transactions', projectAccess, createTransaction);
router.get('/transactions', getAllTransactions);
router.get('/transactions/:transactionId', getTransactionById);
router.put('/transactions/:transactionId', updateTransaction);
router.delete('/transactions/:transactionId', deleteTransaction);

export default router;