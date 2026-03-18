import { Router } from "express";
import type { Db } from "@paperclipai/db";
import {
  createPipelineTemplateSchema,
  updatePipelineTemplateSchema,
  createPipelineRunSchema,
  reviewPipelineStageSchema,
} from "@paperclipai/shared";
import { validate } from "../middleware/validate.js";
import { pipelineService } from "../services/pipelines.js";
import { logActivity } from "../services/activity-log.js";
import { assertCompanyAccess, getActorInfo } from "./authz.js";

export function pipelineRoutes(db: Db) {
  const router = Router();
  const svc = pipelineService(db);

  // Template CRUD

  router.get("/companies/:companyId/pipeline-templates", async (req, res) => {
    const companyId = req.params.companyId as string;
    assertCompanyAccess(req, companyId);
    const result = await svc.templates.list(companyId);
    res.json(result);
  });

  router.post(
    "/companies/:companyId/pipeline-templates",
    validate(createPipelineTemplateSchema),
    async (req, res) => {
      const companyId = req.params.companyId as string;
      assertCompanyAccess(req, companyId);
      const actor = getActorInfo(req);
      const template = await svc.templates.create(companyId, {
        ...req.body,
        createdByUserId: actor.actorType === "user" ? actor.actorId : null,
      });
      await logActivity(db, {
        companyId,
        actorType: actor.actorType,
        actorId: actor.actorId,
        agentId: actor.agentId,
        action: "pipeline_template.created",
        entityType: "pipeline_template",
        entityId: template.id,
        details: { name: template.name },
      });
      res.status(201).json(template);
    },
  );

  router.get("/pipeline-templates/:id", async (req, res) => {
    const id = req.params.id as string;
    const template = await svc.templates.getById(id);
    if (!template) {
      res.status(404).json({ error: "Pipeline template not found" });
      return;
    }
    assertCompanyAccess(req, template.companyId);
    res.json(template);
  });

  router.patch(
    "/pipeline-templates/:id",
    validate(updatePipelineTemplateSchema),
    async (req, res) => {
      const id = req.params.id as string;
      const existing = await svc.templates.getById(id);
      if (!existing) {
        res.status(404).json({ error: "Pipeline template not found" });
        return;
      }
      assertCompanyAccess(req, existing.companyId);
      const template = await svc.templates.update(id, req.body);
      if (!template) {
        res.status(404).json({ error: "Pipeline template not found" });
        return;
      }
      const actor = getActorInfo(req);
      await logActivity(db, {
        companyId: template.companyId,
        actorType: actor.actorType,
        actorId: actor.actorId,
        agentId: actor.agentId,
        action: "pipeline_template.updated",
        entityType: "pipeline_template",
        entityId: template.id,
        details: req.body,
      });
      res.json(template);
    },
  );

  router.delete("/pipeline-templates/:id", async (req, res) => {
    const id = req.params.id as string;
    const existing = await svc.templates.getById(id);
    if (!existing) {
      res.status(404).json({ error: "Pipeline template not found" });
      return;
    }
    assertCompanyAccess(req, existing.companyId);
    const template = await svc.templates.remove(id);
    const actor = getActorInfo(req);
    await logActivity(db, {
      companyId: existing.companyId,
      actorType: actor.actorType,
      actorId: actor.actorId,
      agentId: actor.agentId,
      action: "pipeline_template.deleted",
      entityType: "pipeline_template",
      entityId: existing.id,
    });
    res.json(template);
  });

  // Run operations

  router.get("/companies/:companyId/pipeline-runs", async (req, res) => {
    const companyId = req.params.companyId as string;
    assertCompanyAccess(req, companyId);
    const result = await svc.runs.list(companyId);
    res.json(result);
  });

  router.post(
    "/companies/:companyId/pipeline-runs",
    validate(createPipelineRunSchema),
    async (req, res) => {
      const companyId = req.params.companyId as string;
      assertCompanyAccess(req, companyId);
      const actor = getActorInfo(req);
      const run = await svc.runs.startRun(companyId, {
        ...req.body,
        createdByUserId: actor.actorType === "user" ? actor.actorId : null,
      });
      await logActivity(db, {
        companyId,
        actorType: actor.actorType,
        actorId: actor.actorId,
        agentId: actor.agentId,
        action: "pipeline_run.started",
        entityType: "pipeline_run",
        entityId: run.id,
        details: { name: run.name, templateId: run.templateId },
      });
      res.status(201).json(run);
    },
  );

  router.get("/pipeline-runs/:id", async (req, res) => {
    const id = req.params.id as string;
    const run = await svc.runs.getById(id);
    if (!run) {
      res.status(404).json({ error: "Pipeline run not found" });
      return;
    }
    assertCompanyAccess(req, run.companyId);
    res.json(run);
  });

  router.post("/pipeline-runs/:id/cancel", async (req, res) => {
    const id = req.params.id as string;
    const existing = await svc.runs.getById(id);
    if (!existing) {
      res.status(404).json({ error: "Pipeline run not found" });
      return;
    }
    assertCompanyAccess(req, existing.companyId);
    const run = await svc.runs.cancelRun(id);
    const actor = getActorInfo(req);
    await logActivity(db, {
      companyId: existing.companyId,
      actorType: actor.actorType,
      actorId: actor.actorId,
      agentId: actor.agentId,
      action: "pipeline_run.cancelled",
      entityType: "pipeline_run",
      entityId: existing.id,
    });
    res.json(run);
  });

  // Stage review (manual approve/reject)

  router.post(
    "/pipeline-stages/:id/review",
    validate(reviewPipelineStageSchema),
    async (req, res) => {
      const id = req.params.id as string;
      const stage = await svc.stages.getById(id);
      if (!stage) {
        res.status(404).json({ error: "Pipeline stage not found" });
        return;
      }
      assertCompanyAccess(req, stage.companyId);
      const updated = await svc.stages.reviewStage(id, req.body.decision);
      const actor = getActorInfo(req);
      await logActivity(db, {
        companyId: stage.companyId,
        actorType: actor.actorType,
        actorId: actor.actorId,
        agentId: actor.agentId,
        action: `pipeline_stage.${req.body.decision === "approve" ? "approved" : "rejected"}`,
        entityType: "pipeline_stage",
        entityId: stage.id,
        details: { pipelineRunId: stage.pipelineRunId, stageKey: stage.stageKey },
      });
      res.json(updated);
    },
  );

  return router;
}
