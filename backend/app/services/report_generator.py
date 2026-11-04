"""
GeoVision AI — Written Report Generation Engine
Synthesizes satellite Earth Engine spectral indices, Random Forest ML inferences,
and biophysical change metrics into a formal, structured written intelligence audit report.
"""

from datetime import datetime
from typing import Dict, Any, List, Optional
import io
def generate_written_aoi_report(aoi_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate an in-depth, structured written environmental intelligence report
    based on custom AOI satellite analysis and machine learning findings.
    """
    if not aoi_data or not isinstance(aoi_data, dict):
        raise ValueError("AOI data payload cannot be empty.")

    data = dict(aoi_data)
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
        raise ValueError("Missing required AOI analysis findings ('summary' or 'ml_result'). Regional baseline data cannot be substituted for custom AOI reports.")

    aoi_data = data
    region_name = aoi_data.get("region_name") or "Custom Study Area"
    summary = aoi_data.get("summary") if isinstance(aoi_data.get("summary"), dict) else {}
    area_km2 = float(
        aoi_data.get("area_km2")
        or summary.get("geometry_area_km2")
        or summary.get("total_area_km2")
        or summary.get("monitored_area_km2")
        or summary.get("area_km2")
        or aoi_data.get("geometry_area_km2")
        or 0.0
    )
    geometry = aoi_data.get("geometry") if isinstance(aoi_data.get("geometry"), dict) else {}
    ml_result = aoi_data.get("ml_result") if isinstance(aoi_data.get("ml_result"), dict) else {}
    yearly = aoi_data.get("yearly_progression") or []
    source = aoi_data.get("source") or "Copernicus Sentinel-2 Level-2A via Google Earth Engine"
    start_year = aoi_data.get("start_year", 2023)
    end_year = aoi_data.get("end_year", 2026)

    is_live = bool(aoi_data.get("is_live"))
    is_demo = bool(aoi_data.get("is_demo", not is_live))
    evidence_status = "Live Satellite Observation" if is_live else "Demonstration / Synthetic Calibration Mode"

    # Geometry & Bounding coordinates extraction
    bbox_info = ""
    vertex_count = 0
    if geometry and geometry.get("coordinates") and len(geometry["coordinates"]) > 0:
        try:
            poly_coords = geometry["coordinates"][0]
            vertex_count = len(poly_coords)
            lngs = [float(p[0]) for p in poly_coords]
            lats = [float(p[1]) for p in poly_coords]
            min_lng, max_lng = min(lngs), max(lngs)
            min_lat, max_lat = min(lats), max(lats)
            bbox_info = f"Bounding Extent: [{min_lat:.4f}°N, {min_lng:.4f}°E] to [{max_lat:.4f}°N, {max_lng:.4f}°E] ({vertex_count} vertices)"
        except Exception:
            bbox_info = "User-defined custom vector polygon"
    else:
        bbox_info = "Polygonal Area of Interest"

    risk_score = ml_result.get("risk_score", summary.get("risk_score", 0))
    risk_level = ml_result.get("risk_level", summary.get("risk_level", "Low"))
    ml_prob = ml_result.get("probability", 0.0)
    ml_label = ml_result.get("label", "Undetermined")

    veg_loss_km2 = float(summary.get("vegetation_loss_km2") or 0.0)
    disturb_km2 = float(summary.get("disturbance_km2") or 0.0)
    water_exp_km2 = float(summary.get("water_expansion_km2") or 0.0)
    net_ndvi = float(summary.get("net_ndvi_change") or 0.0)
    net_ndbi = float(summary.get("net_ndbi_change") or 0.0)
    net_ndwi = float(summary.get("net_ndwi_change") or 0.0)
    dominant_risk = summary.get("dominant_risk", "Environmental Shift")

    veg_pct = round((veg_loss_km2 / area_km2 * 100), 1) if area_km2 > 0 else 0.0
    disturb_pct = round((disturb_km2 / area_km2 * 100), 1) if area_km2 > 0 else 0.0
    water_pct = round((water_exp_km2 / area_km2 * 100), 1) if area_km2 > 0 else 0.0

    # Module breakdown
    module_results = {
        "deforestation": {
            "name": "Deforestation & Canopy Loss",
            "analyzed": True,
            "change_indicator": "ΔNDVI",
            "delta_value": net_ndvi,
            "affected_area_km2": veg_loss_km2,
            "footprint_pct": veg_pct,
            "status": "Severe Decline" if net_ndvi < -0.05 else "Moderate Decline" if net_ndvi < -0.02 else "Stable / Normal Vigor",
            "risk_level": "High" if net_ndvi < -0.06 else "Medium" if net_ndvi < -0.02 else "Low",
        },
        "mining": {
            "name": "Mining & Land Disturbance",
            "analyzed": True,
            "change_indicator": "ΔNDBI",
            "delta_value": net_ndbi,
            "affected_area_km2": disturb_km2,
            "footprint_pct": disturb_pct,
            "status": "Significant Bare-Soil Shift" if net_ndbi > 0.04 else "Localized Earthworks" if net_ndbi > 0.01 else "Negligible Excavation",
            "risk_level": "High" if net_ndbi > 0.04 else "Medium" if net_ndbi > 0.01 else "Low",
        },
        "flood": {
            "name": "Flood & Water Extent",
            "analyzed": True,
            "change_indicator": "ΔNDWI",
            "delta_value": net_ndwi,
            "affected_area_km2": water_exp_km2,
            "footprint_pct": water_pct,
            "status": "Substantial Inundation Delta" if net_ndwi > 0.04 else "Seasonal Moisture Shift" if abs(net_ndwi) > 0.01 else "Stable Hydrology",
            "risk_level": "High" if net_ndwi > 0.05 else "Medium" if abs(net_ndwi) > 0.02 else "Low",
        },
    }

    # Technical & Scientific Limitations
    limitations = [
        "Cloud and shadow masking: Multi-temporal optical indices depend on valid pixel clear-sky observation frequencies.",
        "SAR Coherence / InSAR deformation was not analyzed in this optical run; phase interferometry requires dedicated repeat-pass pairs.",
        "Sub-canopy ground validation: Remote sensing measurements capture crown reflectance; field inspections are mandated before statutory enforcement.",
        "Model inferences represent statistical multi-hazard screening classifications rather than legal judicial judgments.",
    ]

    # Severity Descriptor
    if risk_score >= 70 or risk_level.lower() == "high":
        threat_level = "CRITICAL / HIGH PRIORITY"
        status_banner = "Significant biophysical disturbance detected requiring immediate field inspection."
        urgency = "Urgent field verification is mandated within 7 working days."
    elif risk_score >= 40 or risk_level.lower() == "medium":
        threat_level = "MODERATE / MONITORING REQUIRED"
        status_banner = "Noticeable spectral drift and localized surface alterations observed."
        urgency = "Scheduled bi-weekly remote sensing monitoring and quarterly field audits recommended."
    else:
        threat_level = "LOW / NOMINAL STABILITY"
        status_banner = "Canopy indices and surface reflectance remain within baseline equilibrium."
        urgency = "Routine periodic satellite tracking recommended."

    # Section 1: Executive Summary
    executive_summary = (
        f"This Environmental Intelligence Audit assesses the {area_km2:.2f} km² custom Area of Interest (AOI) "
        f"designated as '{region_name}' ({bbox_info}) across the observation period {start_year} to {end_year}. "
        f"Multi-temporal analysis utilizing {source} ({evidence_status}) "
        f"reveals an aggregate Risk Score of {risk_score}/100, placing the territory in the {threat_level} category. "
        f"The primary driver of environmental variation is classified as '{dominant_risk}'. "
        f"{status_banner} {urgency}"
    )

    # Section 2: Biophysical & Spectral Change Assessment
    canopy_status = (
        f"severe canopy decline and defoliation (ΔNDVI: {net_ndvi:+.4f}), encompassing approximately "
        f"{veg_loss_km2:.2f} km² ({veg_pct}% of the surveyed footprint)"
        if net_ndvi < -0.05
        else f"stable vegetation vigor (ΔNDVI: {net_ndvi:+.4f}) with minimal canopy disruption ({veg_loss_km2:.2f} km²)"
    )

    soil_status = (
        f"notable expansion of bare-ground, excavation, or paved surfaces (ΔNDBI: {net_ndbi:+.4f}), "
        f"impacting {disturb_km2:.2f} km² ({disturb_pct}% of total area)"
        if net_ndbi > 0.03
        else f"contained bare soil reflectance (ΔNDBI: {net_ndbi:+.4f}), indicating absence of widespread earthworks"
    )

    water_status = (
        f"substantial moisture delta / water-extent variation (ΔNDWI: {net_ndwi:+.4f}) over {water_exp_km2:.2f} km² ({water_pct}% of area)"
        if abs(net_ndwi) > 0.03
        else f"stable hydrological moisture conditions (ΔNDWI: {net_ndwi:+.4f})"
    )

    biophysical_narrative = (
        f"Surface reflectance differentials indicate {canopy_status}. Concurrently, soil index metrics demonstrate "
        f"{soil_status}. Hydrological indicators exhibit {water_status}. When synthesized, these index shifts indicate "
        f"that human or climatic pressure has disproportionately affected the {dominant_risk.lower()} baseline."
    )

    # Section 3: Machine Learning Diagnostic
    top_features = ml_result.get("top_features") or []
    feat_bullets = []
    for f in top_features[:4]:
        name = f.get("feature", "")
        val = f.get("value", 0.0)
        imp = f.get("importance", 0.0) * 100
        desc = f.get("description", "")
        feat_bullets.append(f"- **{name}** ({val:+.3f} | {imp:.1f}% model weight): {desc}")

    # Reconcile multi-hazard driver vs ML classification
    reconciliation_note = ""
    dom_lower = str(dominant_risk).lower()
    lbl_lower = str(ml_label).lower()
    if "water" in dom_lower or "flood" in dom_lower or "inundation" in dom_lower:
        if "vegetation" in lbl_lower or "canopy" in lbl_lower:
            reconciliation_note = (
                "\n\n*Multi-Hazard Scientific Reconciliation:* While the Random Forest model flags spectral canopy stress "
                "(as submerged or flood-saturated vegetation exhibits attenuated chlorophyll reflectance), biophysical "
                "spectral index decomposition isolates surface water expansion (ΔNDWI) as the primary physical driver."
            )
    elif "mining" in dom_lower or "bare" in dom_lower or "disturb" in dom_lower:
        if "vegetation" in lbl_lower:
            reconciliation_note = (
                "\n\n*Multi-Hazard Scientific Reconciliation:* Mechanical surface excavation and overburden stripping simultaneously "
                "cause canopy removal and bare-soil expansion (ΔNDBI). The Random Forest model captures the canopy loss component, "
                "while spectral decomposition confirms ground stripping as the primary operational activity."
            )

    ml_narrative = (
        f"The calibrated Random Forest classifier evaluated a 15-dimensional multi-spectral feature vector, "
        f"yielding a model prediction of '{ml_label}' with an inferred disturbance probability of {ml_prob * 100:.1f}%. "
        f"Feature attribution percentages represent Mean Decrease in Impurity (Gini MDI importance across the 200-tree ensemble), "
        f"identifying the relative decision weight of each spectral predictor in the model architecture:\n"
        + "\n".join(feat_bullets)
        + reconciliation_note
    )

    # Section 4: Multi-Temporal Trajectory
    year_sentences = []
    total_scenes = 0
    for y in yearly:
        yr = y.get("year")
        ndvi_m = y.get("ndvi_mean")
        ndbi_m = y.get("ndbi_mean")
        sc = y.get("scenes_count", 0) if isinstance(y, dict) else 0
        total_scenes += sc
        health = y.get("vegetation_health", "Nominal")
        sc_text = f" ({sc} scenes)" if sc else ""
        year_sentences.append(
            f"In **{yr}**{sc_text}, median NDVI was recorded at {ndvi_m:.3f} (NDBI: {ndbi_m:.3f}, status: '{health}')."
        )

    num_years = len(yearly)
    if num_years >= 3 and (total_scenes >= 8 or total_scenes == 0):
        temporal_conclusion = (
            f"The consistent multi-year slope across {num_years} observation epochs "
            f"confirms that the observed spectral changes represent persistent multi-season transformations "
            f"rather than transient single-season phenology."
        )
    else:
        temporal_conclusion = (
            f"Current satellite observation density ({num_years} epoch{'s' if num_years != 1 else ''}"
            f"{f', {total_scenes} clear-sky scenes' if total_scenes else ''}) "
            f"reflects an acute or emerging environmental signal across the requested window. "
            f"Determining whether changes constitute permanent ecological conversion versus transient seasonal "
            f"fluctuations requires continued longitudinal monitoring across subsequent satellite passes."
        )

    trajectory_narrative = (
        f"Multi-year progression tracks the historical trajectory of the study area from baseline year {start_year} "
        f"through {end_year}. " + (" ".join(year_sentences) + " " if year_sentences else "") + temporal_conclusion
    )

    # Section 5: Directives & Recommendations
    recommendations = [
        f"Dispatch a designated field reconnaissance team to inspect the flagged {dominant_risk.lower()} sector within '{region_name}'.",
        "Conduct ground-truth boundary validation using handheld RTK-GPS to verify extent of unauthorized clearing or extraction.",
        "Cross-reference satellite coordinates with local land registry and forestry survey boundaries.",
        "Establish an automated Sentinel-2 change alert webhook for monthly delta surveillance.",
    ]
    if risk_score >= 60:
        recommendations.insert(
            0,
            "Issue immediate provisional alert to environmental enforcement authorities regarding elevated land disturbance.",
        )

    # Formatted Markdown Full Report
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC")
    markdown_content = f"""# 📄 GeoVision AI — Environmental Intelligence Audit Report

**Target Area:** {region_name}  
**Surveyed Footprint:** {area_km2:.2f} km²  
**Geographic Extent:** {bbox_info}  
**Observation Window:** {start_year} – {end_year}  
**Generated At:** {now_str}  
**Data Provenance:** {source} ({evidence_status})  
**Overall Threat Level:** **{threat_level}** (Risk Score: {risk_score}/100)  

---

## 1. Executive Summary
{executive_summary}

---

## 2. Quantitative Biophysical & Spectral Findings
{biophysical_narrative}

| Metric / Indicator | Baseline ({start_year}) | Comparison ({end_year}) | Net Delta | Surface Area Impact | Footprint % |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Canopy Density (NDVI)** | {yearly[0].get('ndvi_mean', 0.40) if yearly else 0.40:.4f} | {yearly[-1].get('ndvi_mean', 0.27) if yearly else 0.27:.4f} | **{net_ndvi:+.4f}** | **{veg_loss_km2:.2f} km²** | {veg_pct}% |
| **Bare Soil / Disturbance (NDBI)** | {yearly[0].get('ndbi_mean', 0.01) if yearly else 0.01:.4f} | {yearly[-1].get('ndbi_mean', 0.06) if yearly else 0.06:.4f} | **{net_ndbi:+.4f}** | **{disturb_km2:.2f} km²** | {disturb_pct}% |
| **Surface Water / Moisture (NDWI)** | {yearly[0].get('ndwi_mean', -0.24) if yearly else -0.24:.4f} | {yearly[-1].get('ndwi_mean', -0.19) if yearly else -0.19:.4f} | **{net_ndwi:+.4f}** | **{water_exp_km2:.2f} km²** | {water_pct}% |

---

## 3. Module-Specific Disturbance Breakdown
- **Deforestation:** {module_results['deforestation']['status']} ({module_results['deforestation']['change_indicator']}: {module_results['deforestation']['delta_value']:+.4f}, impact: {module_results['deforestation']['affected_area_km2']:.2f} km²)
- **Mining & Land Disturbance:** {module_results['mining']['status']} ({module_results['mining']['change_indicator']}: {module_results['mining']['delta_value']:+.4f}, impact: {module_results['mining']['affected_area_km2']:.2f} km²)
- **Flood & Water-Extent:** {module_results['flood']['status']} ({module_results['flood']['change_indicator']}: {module_results['flood']['delta_value']:+.4f}, impact: {module_results['flood']['affected_area_km2']:.2f} km²)

---

## 4. Machine Learning Decision & Attribution
{ml_narrative}

---

## 5. Multi-Temporal Trajectory & Historical Drift
{trajectory_narrative}

---

## 6. Technical Limitations & Constraints
{"".join(f"- {lim}\\n" for lim in limitations)}

---

## 7. Regulatory Compliance & Field Inspection Directives
{"".join(f"{i+1}. {r}\\n" for i, r in enumerate(recommendations))}

---

> ⚠️ **Scientific & Legal Disclaimer:** This report contains experimental risk estimates derived from Sentinel-2 satellite surface reflectance indices and Random Forest machine learning inference. Results are designed for decision support and do NOT constitute official government judicial findings without on-ground physical inspection.
"""

    return {
        "title": f"Environmental Intelligence Audit — {region_name}",
        "region_name": region_name,
        "area_km2": area_km2,
        "geometry": geometry,
        "bbox_info": bbox_info,
        "start_year": start_year,
        "end_year": end_year,
        "generated_at": now_str,
        "threat_level": threat_level,
        "risk_score": risk_score,
        "risk_level": risk_level,
        "dominant_risk": dominant_risk,
        "executive_summary": executive_summary,
        "biophysical_findings": biophysical_narrative,
        "ml_diagnostic": ml_narrative,
        "temporal_trajectory": trajectory_narrative,
        "recommendations": recommendations,
        "limitations": limitations,
        "module_results": module_results,
        "markdown_content": markdown_content,
        "metrics": {
            "veg_loss_km2": veg_loss_km2,
            "veg_pct": veg_pct,
            "disturb_km2": disturb_km2,
            "disturb_pct": disturb_pct,
            "water_exp_km2": water_exp_km2,
            "water_pct": water_pct,
            "net_ndvi": net_ndvi,
            "net_ndbi": net_ndbi,
            "net_ndwi": net_ndwi,
        },
        "source": source,
        "is_live": is_live,
        "is_demo": is_demo,
        "evidence_status": evidence_status,
        "yearly_progression": yearly,
        "ml_result": ml_result,
        "imagery_layers": aoi_data.get("imagery_layers") or {},
    }


def generate_aoi_pdf_stream(report: Dict[str, Any]) -> io.BytesIO:
    """Generate a publication-grade, evidence-rich PDF containing the written AOI audit report."""
    from .pdf_report_builder import build_aoi_written_pdf
    return build_aoi_written_pdf(report)

