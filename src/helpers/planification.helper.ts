import {addDays, endOfDay, endOfWeek, startOfDay, startOfWeek} from "date-fns";
import Planification from "../models/planification.schema";
import mongoose from "mongoose";

export const createWeeklyPlanifications = async (startDate: Date, endDate: Date, projectId: string) => {
    let weekStart = startOfDay(startOfWeek(startDate, {weekStartsOn: 1}));
    let weekEnd = endOfDay(endOfWeek(endDate, {weekStartsOn: 1}));

    while (weekStart < endDate) {
        await Planification.create({
            project: new mongoose.Types.ObjectId(projectId),
            startDate: weekStart,
            endDate: endOfWeek(weekStart, {weekStartsOn: 1}),
            planifiedEarnValue: 0,
            planifiedEarnValuePercentage: 0,
            earnValue: 0,
        });

        weekStart = addDays(weekStart, 7);
    }
}

export const updateWeeklyPlanifications = async (startDate: Date, endDate: Date, projectId: string) => {
    let lastPlanification = await Planification.findOne({project: new mongoose.Types.ObjectId(projectId)}).sort({endDate: -1}).limit(1);

    if (!lastPlanification) {
        await createWeeklyPlanifications(startDate, endDate, projectId);
    } else if (lastPlanification.endDate < endDate) {
        await createWeeklyPlanifications(addDays(lastPlanification.endDate, 1), endDate, projectId);
    }
}