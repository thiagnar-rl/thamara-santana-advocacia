import type { Request, Response } from 'express';
import { DashboardModel } from '../models/dashboard.model';
import { hoje } from '../utils/datas';
import { dashboardView } from '../views/dashboard.view';

/** CONTROLLER — Painel do dia */
export const DashboardController = {
  /** GET /api/dashboard */
  async obter(req: Request, res: Response): Promise<void> {
    res.json(dashboardView(await DashboardModel.montar(req.usuarioId, hoje())));
  },
};
