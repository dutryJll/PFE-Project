<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="Electron" modified="2026-04-09T10:00:00.000Z" agent="Mozilla/5.0" etag="wz5h6p7i8j9k0l1m2n3o" version="20.0.0" type="device">
  <diagram name="Sprint2-Class-Candidature" id="c1d2e3f4g5h6i7j8k9l0">
    <mxGraphModel dx="1396" dy="820" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1169" pageHeight="827" background="none" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        
        <!-- USER CLASS -->
        <mxCell id="user_class" value="USER" style="swimlane;fontStyle=1;align=center;verticalAlign=middle;childLayout=stackLayout;horizontal=1;startSize=26;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;collapsible=1;marginBottom=0;rounded=0;shadow=0;strokeWidth=2;" vertex="1" parent="1">
          <mxGeometry x="80" y="80" width="180" height="160" as="geometry" />
        </mxCell>
        <mxCell id="user_attr" value="id: UUID&#10;login: String&#10;email: String&#10;nom: String&#10;prenom: String&#10;dateInscription: DateTime" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=4;spacingRight=4;overflow=hidden;" connectable="0" vertex="1" parent="user_class">
          <mxGeometry y="26" width="180" height="104" as="geometry" />
        </mxCell>
        <mxCell id="user_methods" value="authenticate()&#10;logout()" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=4;spacingRight=4;overflow=hidden;" connectable="0" vertex="1" parent="user_class">
          <mxGeometry y="130" width="180" height="30" as="geometry" />
        </mxCell>

        <!-- CANDIDATURE CLASS (inherits USER) -->
        <mxCell id="candidature_class" value="CANDIDATURE" style="swimlane;fontStyle=1;align=center;verticalAlign=middle;childLayout=stackLayout;horizontal=1;startSize=26;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;collapsible=1;marginBottom=0;rounded=0;shadow=0;strokeWidth=2;" vertex="1" parent="1">
          <mxGeometry x="50" y="320" width="240" height="200" as="geometry" />
        </mxCell>
        <mxCell id="candidature_attr" value="id_candidature: UUID&#10;statut: Enum [brouillon|soumis|sous_examen|preselectionne|accepte|refuse]&#10;dateCreation: DateTime&#10;dateModification: DateTime&#10;dateDepotDossier: DateTime&#10;notes: String&#10;score: Decimal&#10;rang: Integer&#10;feedback: String" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=4;spacingRight=4;overflow=hidden;" connectable="0" vertex="1" parent="candidature_class">
          <mxGeometry y="26" width="240" height="144" as="geometry" />
        </mxCell>
        <mxCell id="candidature_methods" value="soumettre()&#10;modifierBrouillon()&#10;deposerDossier()&#10;ajusterDossier()" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=4;spacingRight=4;overflow=hidden;" connectable="0" vertex="1" parent="candidature_class">
          <mxGeometry y="170" width="240" height="30" as="geometry" />
        </mxCell>

        <!-- FORMATION CLASS -->
        <mxCell id="formation_class" value="FORMATION" style="swimlane;fontStyle=1;align=center;verticalAlign=middle;childLayout=stackLayout;horizontal=1;startSize=26;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;collapsible=1;marginBottom=0;rounded=0;shadow=0;strokeWidth=2;" vertex="1" parent="1">
          <mxGeometry x="420" y="80" width="200" height="180" as="geometry" />
        </mxCell>
        <mxCell id="formation_attr" value="id_formation: UUID&#10;code: String&#10;nom: String&#10;type: Enum [Master|Diplome|Parcours]&#10;description: String&#10;specialites: List&lt;Specialite&gt;&#10;credits: Integer&#10;duree: Integer" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=4;spacingRight=4;overflow=hidden;" connectable="0" vertex="1" parent="formation_class">
          <mxGeometry y="26" width="200" height="124" as="geometry" />
        </mxCell>
        <mxCell id="formation_methods" value="getSpecialites()&#10;getOffres()" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=4;spacingRight=4;overflow=hidden;" connectable="0" vertex="1" parent="formation_class">
          <mxGeometry y="150" width="200" height="30" as="geometry" />
        </mxCell>

        <!-- SPECIALITE CLASS -->
        <mxCell id="specialite_class" value="SPECIALITE" style="swimlane;fontStyle=1;align=center;verticalAlign=middle;childLayout=stackLayout;horizontal=1;startSize=26;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;collapsible=1;marginBottom=0;rounded=0;shadow=0;strokeWidth=2;" vertex="1" parent="1">
          <mxGeometry x="700" y="80" width="180" height="140" as="geometry" />
        </mxCell>
        <mxCell id="specialite_attr" value="id_specialite: UUID&#10;code: String&#10;nom: String&#10;description: String" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=4;spacingRight=4;overflow=hidden;" connectable="0" vertex="1" parent="specialite_class">
          <mxGeometry y="26" width="180" height="84" as="geometry" />
        </mxCell>
        <mxCell id="specialite_methods" value="getCapacite(annee)" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=4;spacingRight=4;overflow=hidden;" connectable="0" vertex="1" parent="specialite_class">
          <mxGeometry y="110" width="180" height="30" as="geometry" />
        </mxCell>

        <!-- OFFRE_PREINSCRIPTION CLASS -->
        <mxCell id="offre_class" value="OFFRE_PREINSCRIPTION" style="swimlane;fontStyle=1;align=center;verticalAlign=middle;childLayout=stackLayout;horizontal=1;startSize=26;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;collapsible=1;marginBottom=0;rounded=0;shadow=0;strokeWidth=2;" vertex="1" parent="1">
          <mxGeometry x="400" y="320" width="240" height="200" as="geometry" />
        </mxCell>
        <mxCell id="offre_attr" value="id_offre: UUID&#10;numeroOffre: String&#10;annee: Integer&#10;dateCreation: DateTime&#10;datePublication: DateTime&#10;dateClotureInscription: DateTime&#10;statut: Enum [draft|active|closed]&#10;capaciteTotale: Integer&#10;capaciteParSpecialite: Map&lt;Specialite,Integer&gt;" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=4;spacingRight=4;overflow=hidden;" connectable="0" vertex="1" parent="offre_class">
          <mxGeometry y="26" width="240" height="144" as="geometry" />
        </mxCell>
        <mxCell id="offre_methods" value="publier()&#10;cloturer()&#10;getPlacesDisponibles()" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=4;spacingRight=4;overflow=hidden;" connectable="0" vertex="1" parent="offre_class">
          <mxGeometry y="170" width="240" height="30" as="geometry" />
        </mxCell>

        <!-- COMMISSION CLASS -->
        <mxCell id="commission_class" value="COMMISSION" style="swimlane;fontStyle=1;align=center;verticalAlign=middle;childLayout=stackLayout;horizontal=1;startSize=26;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;collapsible=1;marginBottom=0;rounded=0;shadow=0;strokeWidth=2;" vertex="1" parent="1">
          <mxGeometry x="750" y="320" width="220" height="200" as="geometry" />
        </mxCell>
        <mxCell id="commission_attr" value="id_commission: UUID&#10;nom: String&#10;president: String&#10;membres: List&lt;String&gt;&#10;dateCreation: DateTime&#10;statut: Enum [active|inactive]&#10;description: String" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=4;spacingRight=4;overflow=hidden;" connectable="0" vertex="1" parent="commission_class">
          <mxGeometry y="26" width="220" height="124" as="geometry" />
        </mxCell>
        <mxCell id="commission_methods" value="creerOffre()&#10;evaluerCandidatures()&#10;genererClassement()&#10;publierResultats()" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=4;spacingRight=4;overflow=hidden;" connectable="0" vertex="1" parent="commission_class">
          <mxGeometry y="150" width="220" height="50" as="geometry" />
        </mxCell>

        <!-- DOSSIER CLASS -->
        <mxCell id="dossier_class" value="DOSSIER" style="swimlane;fontStyle=1;align=center;verticalAlign=middle;childLayout=stackLayout;horizontal=1;startSize=26;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;collapsible=1;marginBottom=0;rounded=0;shadow=0;strokeWidth=2;" vertex="1" parent="1">
          <mxGeometry x="80" y="580" width="240" height="180" as="geometry" />
        </mxCell>
        <mxCell id="dossier_attr" value="id_dossier: UUID&#10;dateDepot: DateTime&#10;dateAjustement: DateTime&#10;statut: Enum [en_cours|complete|sous_verification|validee|rejetee]&#10;documents: List&lt;Document&gt;&#10;scoreOCR: Decimal&#10;feedback: String" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=4;spacingRight=4;overflow=hidden;" connectable="0" vertex="1" parent="dossier_class">
          <mxGeometry y="26" width="240" height="124" as="geometry" />
        </mxCell>
        <mxCell id="dossier_methods" value="deposer()&#10;ajuster()&#10;valider()" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=4;spacingRight=4;overflow=hidden;" connectable="0" vertex="1" parent="dossier_class">
          <mxGeometry y="150" width="240" height="30" as="geometry" />
        </mxCell>

        <!-- DOCUMENT CLASS -->
        <mxCell id="document_class" value="DOCUMENT" style="swimlane;fontStyle=1;align=center;verticalAlign=middle;childLayout=stackLayout;horizontal=1;startSize=26;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;collapsible=1;marginBottom=0;rounded=0;shadow=0;strokeWidth=2;" vertex="1" parent="1">
          <mxGeometry x="400" y="580" width="220" height="180" as="geometry" />
        </mxCell>
        <mxCell id="document_attr" value="id_document: UUID&#10;nom: String&#10;type: Enum [diplome|cv|lettre|dossier]&#10;cheminFichier: String&#10;dateUpload: DateTime&#10;taille: Long&#10;statutOCR: Enum [pending|processed|error]&#10;donneeExtraite: JSON" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=4;spacingRight=4;overflow=hidden;" connectable="0" vertex="1" parent="document_class">
          <mxGeometry y="26" width="220" height="124" as="geometry" />
        </mxCell>
        <mxCell id="document_methods" value="traiterOCR()&#10;valider()" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=4;spacingRight=4;overflow=hidden;" connectable="0" vertex="1" parent="document_class">
          <mxGeometry y="150" width="220" height="30" as="geometry" />
        </mxCell>

        <!-- NOTIFICATION CLASS -->
        <mxCell id="notification_class" value="NOTIFICATION" style="swimlane;fontStyle=1;align=center;verticalAlign=middle;childLayout=stackLayout;horizontal=1;startSize=26;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;collapsible=1;marginBottom=0;rounded=0;shadow=0;strokeWidth=2;" vertex="1" parent="1">
          <mxGeometry x="750" y="580" width="220" height="180" as="geometry" />
        </mxCell>
        <mxCell id="notification_attr" value="id_notification: UUID&#10;type: Enum [statut|score|offre|document]&#10;titre: String&#10;message: String&#10;dateCreation: DateTime&#10;statut: Enum [sent|read|archived]&#10;canal: Enum [email|sms|notification]" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=4;spacingRight=4;overflow=hidden;" connectable="0" vertex="1" parent="notification_class">
          <mxGeometry y="26" width="220" height="124" as="geometry" />
        </mxCell>
        <mxCell id="notification_methods" value="envoyer()&#10;marquerCommeDelue()&#10;archiver()" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=4;spacingRight=4;overflow=hidden;" connectable="0" vertex="1" parent="notification_class">
          <mxGeometry y="150" width="220" height="30" as="geometry" />
        </mxCell>

        <!-- INHERITANCE: CANDIDATURE extends USER -->
        <mxCell id="inheritance_cand_user" value="" style="endArrow=block;endFill=0;html=1;edgeStyle=orthogonalEdgeStyle;rounded=0;strokeWidth=2;" edge="1" parent="1" source="candidature_class" target="user_class">
          <mxGeometry relative="1" as="geometry">
            <mxPoint x="170" y="320" as="sourcePoint" />
            <mxPoint x="170" y="240" as="targetPoint" />
            <Array as="points">
              <mxPoint x="170" y="310" />
              <mxPoint x="170" y="240" />
            </Array>
          </mxGeometry>
        </mxCell>

        <!-- RELATIONSHIP: CANDIDATURE -> OFFRE_PREINSCRIPTION -->
        <mxCell id="rel_cand_offre" value="postule&#10;0..*" style="endArrow=none;html=1;edgeStyle=orthogonalEdgeStyle;rounded=0;strokeWidth=2;" edge="1" parent="1" source="candidature_class" target="offre_class">
          <mxGeometry relative="1" as="geometry">
            <mxPoint x="290" y="420" as="sourcePoint" />
            <mxPoint x="400" y="420" as="targetPoint" />
          </mxGeometry>
        </mxCell>

        <!-- RELATIONSHIP: CANDIDATURE -> DOSSIER -->
        <mxCell id="rel_cand_dossier" value="soumis par&#10;1" style="endArrow=none;html=1;edgeStyle=orthogonalEdgeStyle;rounded=0;strokeWidth=2;" edge="1" parent="1" source="candidature_class" target="dossier_class">
          <mxGeometry relative="1" as="geometry">
            <mxPoint x="140" y="520" as="sourcePoint" />
            <mxPoint x="140" y="580" as="targetPoint" />
          </mxGeometry>
        </mxCell>

        <!-- RELATIONSHIP: DOSSIER -> DOCUMENT -->
        <mxCell id="rel_dossier_doc" value="contient&#10;1..*" style="endArrow=none;html=1;edgeStyle=orthogonalEdgeStyle;rounded=0;strokeWidth=2;" edge="1" parent="1" source="dossier_class" target="document_class">
          <mxGeometry relative="1" as="geometry">
            <mxPoint x="320" y="630" as="sourcePoint" />
            <mxPoint x="400" y="630" as="targetPoint" />
          </mxGeometry>
        </mxCell>

        <!-- RELATIONSHIP: OFFRE_PREINSCRIPTION -> FORMATION -->
        <mxCell id="rel_offre_form" value="propose&#10;1" style="endArrow=none;html=1;edgeStyle=orthogonalEdgeStyle;rounded=0;strokeWidth=2;" edge="1" parent="1" source="offre_class" target="formation_class">
          <mxGeometry relative="1" as="geometry">
            <mxPoint x="520" y="320" as="sourcePoint" />
            <mxPoint x="520" y="260" as="targetPoint" />
          </mxGeometry>
        </mxCell>

        <!-- RELATIONSHIP: OFFRE_PREINSCRIPTION -> SPECIALITE (capacite par specialite) -->
        <mxCell id="rel_offre_spec" value="capacite par&#10;0..*" style="endArrow=none;html=1;edgeStyle=orthogonalEdgeStyle;rounded=0;strokeWidth=2;" edge="1" parent="1" source="offre_class" target="specialite_class">
          <mxGeometry relative="1" as="geometry">
            <mxPoint x="640" y="380" as="sourcePoint" />
            <mxPoint x="700" y="150" as="targetPoint" />
            <Array as="points">
              <mxPoint x="670" y="380" />
              <mxPoint x="670" y="150" />
            </Array>
          </mxGeometry>
        </mxCell>

        <!-- RELATIONSHIP: FORMATION -> SPECIALITE -->
        <mxCell id="rel_form_spec" value="comprend&#10;1..*" style="endArrow=none;html=1;edgeStyle=orthogonalEdgeStyle;rounded=0;strokeWidth=2;" edge="1" parent="1" source="formation_class" target="specialite_class">
          <mxGeometry relative="1" as="geometry">
            <mxPoint x="620" y="150" as="sourcePoint" />
            <mxPoint x="700" y="150" as="targetPoint" />
          </mxGeometry>
        </mxCell>

        <!-- RELATIONSHIP: COMMISSION -> OFFRE_PREINSCRIPTION -->
        <mxCell id="rel_commission_offre" value="crée&#10;1..*" style="endArrow=none;html=1;edgeStyle=orthogonalEdgeStyle;rounded=0;strokeWidth=2;" edge="1" parent="1" source="commission_class" target="offre_class">
          <mxGeometry relative="1" as="geometry">
            <mxPoint x="750" y="420" as="sourcePoint" />
            <mxPoint x="640" y="420" as="targetPoint" />
          </mxGeometry>
        </mxCell>

        <!-- RELATIONSHIP: CANDIDATURE -> NOTIFICATION -->
        <mxCell id="rel_cand_notif" value="reçoit&#10;1..*" style="endArrow=none;html=1;edgeStyle=orthogonalEdgeStyle;rounded=0;strokeWidth=2;" edge="1" parent="1" source="candidature_class" target="notification_class">
          <mxGeometry relative="1" as="geometry">
            <mxPoint x="290" y="630" as="sourcePoint" />
            <mxPoint x="750" y="660" as="targetPoint" />
            <Array as="points">
              <mxPoint x="500" y="680" />
              <mxPoint x="750" y="660" />
            </Array>
          </mxGeometry>
        </mxCell>

      </root>
    </mxGraphModel>
  </diagram>
</mxfile>