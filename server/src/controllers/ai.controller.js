import {
  analyzeLeadService,
  getLatestLeadAnalysisService,
} from '../services/ai.service.js';

/**
 * Trigger AI analysis for a lead using Gemini API
 * POST /api/ai/analyze/:leadId
 */
export const analyzeLead = async (req, res, next) => {
  try {
    const { leadId } = req.params;

    const analysis = await analyzeLeadService({
      leadId,
      user: req.user,
    });

    res.status(200).json({
      success: true,
      status: 'success',
      message: 'Lead analyzed successfully with Google Gemini AI.',
      data: analysis,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get latest AI analysis for a lead
 * GET /api/ai/lead/:leadId
 */
export const getLeadAnalysis = async (req, res, next) => {
  try {
    const { leadId } = req.params;

    const analysis = await getLatestLeadAnalysisService({
      leadId,
      user: req.user,
    });

    res.status(200).json({
      success: true,
      status: 'success',
      data: analysis,
    });
  } catch (error) {
    next(error);
  }
};
