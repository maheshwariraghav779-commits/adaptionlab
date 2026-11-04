"""Reports endpoints — JSON summary and PDF download."""

import io
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Query, HTTPException
from fastapi.responses import StreamingResponse
from ..schemas.responses import ReportSummaryResponse
from ..services.demo_data import demo_data, DEMO_SOURCE, ANALYSIS_DATE
from ..config import settings

router = APIRouter()

DISCLAIMER = (
    "This report contains experimental risk estimates generated from satellite-derived "
    "environmental indicators. Results are NOT official government assessments and require "
    "field verification. Risk scores are model/demo risk categories, not validated predictions. "
    "Do not use this report as a substitute for official environmental impact assessments."
)


@router.get("/reports/summary", response_model=ReportSummaryResponse)
async def get_report_summary():
    overview = demo_data.get_overview()
    defor = demo_data.get_module_data("deforestation")
    mining = demo_data.get_module_data("mining")
    flood = demo_data.get_module_data("flood")

    return ReportSummaryResponse(
        title="GeoVision AI — Environmental Risk Assessment Report",
        generated_at=datetime.now().isoformat(),
        pilot_area=settings.PILOT_AREA,
        analysis_period=settings.ANALYSIS_PERIOD,
        overview={
            "total_regions": overview["total_monitored_regions"],
            "total_points": overview["total_points"],
            "high_risk_zones": overview["high_risk_zones"],
        },
        deforestation={
            "total_points": defor["summary"]["total_points"],
            "high_risk": defor["risk_distribution"]["high"],
            "avg_ndvi_change": defor["summary"]["avg_change"],
        },
        mining={
            "total_points": mining["summary"]["total_points"],
            "high_risk": mining["risk_distribution"]["high"],
            "avg_ndbi_change": mining["summary"]["avg_change"],
        },
        flood={
            "total_points": flood["summary"]["total_points"],
            "high_risk": flood["risk_distribution"]["high"],
            "avg_ndwi_change": flood["summary"]["avg_change"],
        },
        source=demo_data.get_source(),
        is_demo=demo_data.is_demo,
        disclaimer=DISCLAIMER,
    )


from ..services.pdf_report_builder import (
    build_regional_summary_pdf,
    build_mining_report_pdf,
    build_deforestation_report_pdf,
    build_flood_report_pdf,
    build_satellite_comparison_pdf,
    build_aoi_written_pdf,
)


@router.get("/reports/pdf")
async def download_pdf_report(
    module: Optional[str] = Query(None, description="Filter by module: deforestation, mining, flood"),
    risk_level: Optional[str] = Query(None, description="Filter by risk level: High, Medium, Low"),
):
    """Generate and stream a publication-grade, evidence-rich A4 PDF report."""
    try:
        mod_key = (module or "").lower().strip()
        risk_filter = risk_level.strip() if risk_level else None

        if mod_key == "mining":
            mod_data = demo_data.get_module_data("mining")
            s = mod_data.get("summary", {})
            high_count = s.get("high_risk_zones", 12)
            payload = {
                "region_name": f"{settings.PILOT_AREA} (Mining & Land Disturbance)",
                "geometry_area_km2": 2400.0,
                "valid_observed_area_km2": 2350.0,
                "affected_area_km2": round(float(high_count) * 0.45, 2),
                "risk_score": int(round(float(s.get("avg_risk_score", 48)))),
                "risk_level": "High" if float(s.get("avg_risk_score", 48)) >= 60 else "Medium",
                "base_year": 2023,
                "eval_year": 2026,
                "is_live": False,
                "source": demo_data.get_source(),
                "s2_metrics": {
                    "ndbi_change": float(s.get("avg_change", 0.042)),
                    "ndbi_mean_base": 0.051,
                    "ndbi_mean_eval": 0.051 + float(s.get("avg_change", 0.042)),
                    "ndvi_change": -0.065,
                    "bare_soil_expansion_km2": round(float(high_count) * 0.45, 2),
                },
                "s1_metrics": {
                    "vv_change_db": -1.85,
                    "vv_mean_base_db": -11.2,
                    "vv_mean_eval_db": -13.05,
                    "sar_roughness_loss_km2": round(float(high_count) * 0.38, 2),
                },
                "sensor_status": {
                    "fusion_status": "Calibrated Dual-Sensor Dataset",
                },
            }
            buffer = build_mining_report_pdf(payload)
            filename = f"geovision_mining_audit_{datetime.now().strftime('%Y%m%d_%H%M')}.pdf"

        elif mod_key == "deforestation":
            mod_data = demo_data.get_module_data("deforestation")
            s = mod_data.get("summary", {})
            high_count = s.get("high_risk_zones", 15)
            payload = {
                "region_name": f"{settings.PILOT_AREA} (Forest Canopy & Ecological Reserves)",
                "geometry_area_km2": 2400.0,
                "valid_observed_area_km2": 2380.0,
                "affected_area_km2": round(float(high_count) * 0.62, 2),
                "risk_score": int(round(float(s.get("avg_risk_score", 52)))),
                "risk_level": "High" if float(s.get("avg_risk_score", 52)) >= 60 else "Medium",
                "base_year": 2023,
                "eval_year": 2026,
                "is_live": False,
                "source": demo_data.get_source(),
                "s2_metrics": {
                    "ndvi_change": float(s.get("avg_change", -0.084)),
                    "ndvi_mean_base": 0.418,
                    "ndvi_mean_eval": 0.418 + float(s.get("avg_change", -0.084)),
                    "canopy_loss_area_km2": round(float(high_count) * 0.62, 2),
                },
                "s1_metrics": {
                    "vh_change_db": -2.25,
                    "vh_mean_base_db": -16.5,
                    "vh_mean_eval_db": -18.75,
                    "sar_structural_loss_km2": round(float(high_count) * 0.52, 2),
                },
                "sensor_status": {
                    "fusion_status": "Calibrated Dual-Sensor Dataset",
                },
            }
            buffer = build_deforestation_report_pdf(payload)
            filename = f"geovision_deforestation_audit_{datetime.now().strftime('%Y%m%d_%H%M')}.pdf"

        elif mod_key == "flood":
            mod_data = demo_data.get_module_data("flood")
            s = mod_data.get("summary", {})
            high_count = s.get("high_risk_zones", 8)
            payload = {
                "region_name": f"{settings.PILOT_AREA} (Hydrological Basin & Flood Corridors)",
                "geometry_area_km2": 2400.0,
                "valid_observed_area_km2": 2360.0,
                "affected_area_km2": round(float(high_count) * 0.78, 2),
                "risk_score": int(round(float(s.get("avg_risk_score", 42)))),
                "risk_level": "High" if float(s.get("avg_risk_score", 42)) >= 60 else "Medium",
                "base_year": 2023,
                "eval_year": 2026,
                "is_live": False,
                "source": demo_data.get_source(),
                "s2_metrics": {
                    "ndwi_change": float(s.get("avg_change", 0.055)),
                    "ndwi_mean_base": -0.215,
                    "ndwi_mean_eval": -0.215 + float(s.get("avg_change", 0.055)),
                    "flood_inundation_area_km2": round(float(high_count) * 0.78, 2),
                },
                "s1_metrics": {
                    "vv_change_db": -2.60,
                    "sar_specular_flood_km2": round(float(high_count) * 0.70, 2),
                },
                "sensor_status": {
                    "fusion_status": "Calibrated Dual-Sensor Dataset",
                },
            }
            buffer = build_flood_report_pdf(payload)
            filename = f"geovision_flood_audit_{datetime.now().strftime('%Y%m%d_%H%M')}.pdf"

        else:
            summary_resp = await get_report_summary()
            summary_dict = summary_resp.model_dump()
            buffer = build_regional_summary_pdf(summary_dict, module=module, risk_level=risk_filter)
            filename = f"geovision_regional_audit_{module or 'all'}_{datetime.now().strftime('%Y%m%d_%H%M')}.pdf"

        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")


@router.post("/reports/satellite-comparison-pdf")
async def download_satellite_comparison_pdf_report(payload: dict):
    """
    Generate and stream a publication-grade Satellite Comparison Audit PDF report.
    """
    if not payload or not isinstance(payload, dict):
        raise HTTPException(status_code=400, detail="Comparison payload is required.")

    try:
        buffer = build_satellite_comparison_pdf(payload)
        reg_name = payload.get("region_name") or "satellite_comparison"
        safe_name = "".join(c for c in reg_name if c.isalnum() or c in ("-", "_")).strip() or "comparison"
        filename = f"geovision_comparison_{safe_name}_{datetime.now().strftime('%Y%m%d_%H%M')}.pdf"
        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Satellite comparison PDF generation failed: {str(e)}")


@router.post("/reports/module-pdf")
async def download_module_pdf_report(payload: dict):
    """
    Generate and stream a publication-grade PDF report for any analysis module
    (mining, deforestation, flood, or regional summary).
    """
    if not payload or not isinstance(payload, dict):
        raise HTTPException(status_code=400, detail="Analysis payload is required.")

    mod = (payload.get("module") or "").lower()
    data = payload.get("data") if isinstance(payload.get("data"), dict) else payload

    try:
        if mod == "mining" or "bare_soil" in str(data):
            buffer = build_mining_report_pdf(data)
            mod_tag = "mining"
        elif mod == "deforestation" or "canopy_loss" in str(data):
            buffer = build_deforestation_report_pdf(data)
            mod_tag = "deforestation"
        elif mod == "flood" or "flood_inundation" in str(data):
            buffer = build_flood_report_pdf(data)
            mod_tag = "flood"
        elif "before_metadata" in data and "after_metadata" in data:
            buffer = build_satellite_comparison_pdf(data)
            mod_tag = "comparison"
        else:
            summary_resp = await get_report_summary()
            buffer = build_regional_summary_pdf(summary_resp.model_dump(), module=mod)
            mod_tag = mod or "regional"

        reg_name = data.get("region_name") or data.get("aoi_name") or mod_tag
        safe_name = "".join(c for c in reg_name if c.isalnum() or c in ("-", "_")).strip() or mod_tag
        filename = f"geovision_{mod_tag}_{safe_name}_{datetime.now().strftime('%Y%m%d_%H%M')}.pdf"
        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Module PDF generation failed: {str(e)}")


def _normalize_and_validate_aoi_payload(payload: dict) -> dict:
    if not payload or not isinstance(payload, dict):
        raise HTTPException(
            status_code=400,
            detail="Payload is required for custom AOI report generation. Regional reports must be accessed via /reports/summary.",
        )

    data = dict(payload)
    # Recursively unwrap supported nested analysis_results payloads
    while "analysis_results" in data and isinstance(data["analysis_results"], dict):
        ar = dict(data["analysis_results"])
        for k, v in data.items():
            if k != "analysis_results" and k not in ar:
                ar[k] = v
        data = ar

    if "aoi_name" in data and not data.get("region_name"):
        data["region_name"] = data["aoi_name"]

    summary = data.get("summary")
    ml_result = data.get("ml_result")
    valid_summary = isinstance(summary, dict) and len(summary) > 0
    valid_ml = isinstance(ml_result, dict) and len(ml_result) > 0

    if not valid_summary and not valid_ml:
        raise HTTPException(
            status_code=400,
            detail="Missing required AOI analysis findings ('summary' or 'ml_result'). Regional baseline data cannot be substituted for custom AOI reports.",
        )

    return data


@router.post("/reports/generate-aoi-report")
@router.post("/reports/aoi")
async def create_aoi_written_report(payload: dict = None):
    """
    Generate an in-depth, structured written environmental intelligence report
    synthesized directly from custom AOI satellite analysis data.
    """
    from ..services.report_generator import generate_written_aoi_report

    data = _normalize_and_validate_aoi_payload(payload)

    try:
        report = generate_written_aoi_report(data)
        return report
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Written report generation failed: {str(e)}")


@router.post("/reports/aoi-pdf")
@router.post("/reports/download-aoi-pdf")
async def download_aoi_pdf_report(payload: dict = None):
    """
    Generate and stream a full PDF audit report specifically for a custom AOI written analysis.
    """
    from ..services.report_generator import generate_written_aoi_report, generate_aoi_pdf_stream

    data = _normalize_and_validate_aoi_payload(payload)

    try:
        report = generate_written_aoi_report(data)
        pdf_buffer = generate_aoi_pdf_stream(report)
        safe_name = "".join(c for c in report["region_name"] if c.isalnum() or c in ("-", "_")).strip() or "aoi"
        filename = f"geovision_audit_{safe_name}_{datetime.now().strftime('%Y%m%d_%H%M')}.pdf"
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AOI PDF generation failed: {str(e)}")

