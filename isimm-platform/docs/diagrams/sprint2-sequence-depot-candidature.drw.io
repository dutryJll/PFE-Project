<mxfile host="app.diagrams.net" modified="2026-04-09T15:05:00.000Z" agent="GitHub Copilot" version="24.7.17" type="device">
  <diagram id="s2-31-32" name="Sprint2-3.1-3.2-Postuler-Modifier">
    <mxGraphModel dx="1400" dy="900" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1800" pageHeight="1400" math="0" shadow="0">
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>

        <mxCell id="t1" value="Sprint 2 - Depot de candidatures (US 3.1, 3.2)" style="text;html=1;align=left;verticalAlign=middle;fontStyle=1;fontSize=16;" vertex="1" parent="1"><mxGeometry x="40" y="20" width="820" height="30" as="geometry"/></mxCell>

        <mxCell id="h1" value="Candidat" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#1F4E78;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="70" y="80" width="130" height="40" as="geometry"/></mxCell>
        <mxCell id="h2" value="Frontend Angular" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#1F4E78;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="290" y="80" width="170" height="40" as="geometry"/></mxCell>
        <mxCell id="h3" value="Candidature API" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#1F4E78;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="560" y="80" width="170" height="40" as="geometry"/></mxCell>
        <mxCell id="h4" value="Config Appel" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#1F4E78;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="840" y="80" width="150" height="40" as="geometry"/></mxCell>
        <mxCell id="h5" value="DB Candidature" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#1F4E78;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="1090" y="80" width="170" height="40" as="geometry"/></mxCell>

        <mxCell id="l1" value="" style="endArrow=none;dashed=1;strokeColor=#6C8EBF;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="135" y="120" as="sourcePoint"/><mxPoint x="135" y="1280" as="targetPoint"/></mxGeometry></mxCell>
        <mxCell id="l2" value="" style="endArrow=none;dashed=1;strokeColor=#6C8EBF;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="375" y="120" as="sourcePoint"/><mxPoint x="375" y="1280" as="targetPoint"/></mxGeometry></mxCell>
        <mxCell id="l3" value="" style="endArrow=none;dashed=1;strokeColor=#6C8EBF;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="645" y="120" as="sourcePoint"/><mxPoint x="645" y="1280" as="targetPoint"/></mxGeometry></mxCell>
        <mxCell id="l4" value="" style="endArrow=none;dashed=1;strokeColor=#6C8EBF;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="915" y="120" as="sourcePoint"/><mxPoint x="915" y="1280" as="targetPoint"/></mxGeometry></mxCell>
        <mxCell id="l5" value="" style="endArrow=none;dashed=1;strokeColor=#6C8EBF;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="1175" y="120" as="sourcePoint"/><mxPoint x="1175" y="1280" as="targetPoint"/></mxGeometry></mxCell>

        <mxCell id="m1" value="1) Choisir master/concours + remplir formulaire" style="endArrow=block;html=1;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="135" y="180" as="sourcePoint"/><mxPoint x="375" y="180" as="targetPoint"/></mxGeometry></mxCell>
        <mxCell id="m2" value="2) POST /api/candidatures/create/" style="endArrow=block;html=1;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="375" y="240" as="sourcePoint"/><mxPoint x="645" y="240" as="targetPoint"/></mxGeometry></mxCell>
        <mxCell id="m3" value="3) Verifier ouverture appel" style="endArrow=block;html=1;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="645" y="300" as="sourcePoint"/><mxPoint x="915" y="300" as="targetPoint"/></mxGeometry></mxCell>
        <mxCell id="m4" value="4) Retour regles + delais" style="endArrow=open;dashed=1;html=1;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="915" y="360" as="sourcePoint"/><mxPoint x="645" y="360" as="targetPoint"/></mxGeometry></mxCell>

        <mxCell id="alt31" value="alt [hors periode ou donnees invalides]" style="rounded=0;whiteSpace=wrap;html=1;strokeColor=#B85450;fillColor=none;dashed=1;" vertex="1" parent="1"><mxGeometry x="250" y="400" width="520" height="110" as="geometry"/></mxCell>
        <mxCell id="m5" value="5a) 400/403 + message erreur" style="endArrow=block;html=1;strokeColor=#B85450;fontColor=#B85450;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="645" y="460" as="sourcePoint"/><mxPoint x="375" y="460" as="targetPoint"/></mxGeometry></mxCell>

        <mxCell id="else31" value="else [demande valide]" style="rounded=0;whiteSpace=wrap;html=1;strokeColor=#82B366;fillColor=none;dashed=1;" vertex="1" parent="1"><mxGeometry x="250" y="530" width="1020" height="300" as="geometry"/></mxCell>
        <mxCell id="m6" value="5b) Inserer candidature(statut=brouillon/soumis)" style="endArrow=block;html=1;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="645" y="600" as="sourcePoint"/><mxPoint x="1175" y="600" as="targetPoint"/></mxGeometry></mxCell>
        <mxCell id="m7" value="6) 201 Created + id candidature" style="endArrow=open;dashed=1;html=1;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="645" y="660" as="sourcePoint"/><mxPoint x="375" y="660" as="targetPoint"/></mxGeometry></mxCell>
        <mxCell id="m8" value="7) Afficher confirmation" style="endArrow=block;html=1;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="375" y="720" as="sourcePoint"/><mxPoint x="135" y="720" as="targetPoint"/></mxGeometry></mxCell>

        <mxCell id="sec32" value="US 3.2 Modifier avant expiration" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#FFF2CC;strokeColor=#D6B656;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="40" y="860" width="300" height="30" as="geometry"/></mxCell>
        <mxCell id="m9" value="8) Ouvrir candidature existante" style="endArrow=block;html=1;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="135" y="930" as="sourcePoint"/><mxPoint x="375" y="930" as="targetPoint"/></mxGeometry></mxCell>
        <mxCell id="m10" value="9) PUT /api/candidatures/{id}/modifier/" style="endArrow=block;html=1;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="375" y="990" as="sourcePoint"/><mxPoint x="645" y="990" as="targetPoint"/></mxGeometry></mxCell>
        <mxCell id="m11" value="10) Verifier deadline modification" style="endArrow=block;html=1;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="645" y="1050" as="sourcePoint"/><mxPoint x="915" y="1050" as="targetPoint"/></mxGeometry></mxCell>

        <mxCell id="alt32" value="alt [delai depasse]" style="rounded=0;whiteSpace=wrap;html=1;strokeColor=#B85450;fillColor=none;dashed=1;" vertex="1" parent="1"><mxGeometry x="250" y="1090" width="470" height="100" as="geometry"/></mxCell>
        <mxCell id="m12" value="11a) 403 Modification interdite" style="endArrow=block;html=1;strokeColor=#B85450;fontColor=#B85450;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="645" y="1140" as="sourcePoint"/><mxPoint x="375" y="1140" as="targetPoint"/></mxGeometry></mxCell>

        <mxCell id="else32" value="else [dans delai]" style="rounded=0;whiteSpace=wrap;html=1;strokeColor=#82B366;fillColor=none;dashed=1;" vertex="1" parent="1"><mxGeometry x="250" y="1200" width="1020" height="120" as="geometry"/></mxCell>
        <mxCell id="m13" value="11b) Update candidature" style="endArrow=block;html=1;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="645" y="1250" as="sourcePoint"/><mxPoint x="1175" y="1250" as="targetPoint"/></mxGeometry></mxCell>
        <mxCell id="m14" value="12) 200 OK + candidature mise a jour" style="endArrow=open;dashed=1;html=1;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="645" y="1310" as="sourcePoint"/><mxPoint x="375" y="1310" as="targetPoint"/></mxGeometry></mxCell>
      </root>
    </mxGraphModel>
  </diagram>

  <diagram id="s2-33-34" name="Sprint2-3.3-3.4-Etat-Notification">
    <mxGraphModel dx="1400" dy="900" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1800" pageHeight="1300" math="0" shadow="0">
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>

        <mxCell id="t2" value="Sprint 2 - Suivi et notifications (US 3.3, 3.4)" style="text;html=1;align=left;verticalAlign=middle;fontStyle=1;fontSize=16;" vertex="1" parent="1"><mxGeometry x="40" y="20" width="820" height="30" as="geometry"/></mxCell>

        <mxCell id="a1" value="Candidat" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#1F4E78;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="70" y="80" width="130" height="40" as="geometry"/></mxCell>
        <mxCell id="a2" value="Frontend Angular" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#1F4E78;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="290" y="80" width="170" height="40" as="geometry"/></mxCell>
        <mxCell id="a3" value="Candidature API" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#1F4E78;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="560" y="80" width="170" height="40" as="geometry"/></mxCell>
        <mxCell id="a4" value="DB Candidature" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#1F4E78;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="840" y="80" width="170" height="40" as="geometry"/></mxCell>
        <mxCell id="a5" value="Notification Service" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#1F4E78;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="1110" y="80" width="180" height="40" as="geometry"/></mxCell>
        <mxCell id="a6" value="Email Service" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#1F4E78;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="1390" y="80" width="150" height="40" as="geometry"/></mxCell>

        <mxCell id="la1" value="" style="endArrow=none;dashed=1;strokeColor=#6C8EBF;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="135" y="120" as="sourcePoint"/><mxPoint x="135" y="1200" as="targetPoint"/></mxGeometry></mxCell>
        <mxCell id="la2" value="" style="endArrow=none;dashed=1;strokeColor=#6C8EBF;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="375" y="120" as="sourcePoint"/><mxPoint x="375" y="1200" as="targetPoint"/></mxGeometry></mxCell>
        <mxCell id="la3" value="" style="endArrow=none;dashed=1;strokeColor=#6C8EBF;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="645" y="120" as="sourcePoint"/><mxPoint x="645" y="1200" as="targetPoint"/></mxGeometry></mxCell>
        <mxCell id="la4" value="" style="endArrow=none;dashed=1;strokeColor=#6C8EBF;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="925" y="120" as="sourcePoint"/><mxPoint x="925" y="1200" as="targetPoint"/></mxGeometry></mxCell>
        <mxCell id="la5" value="" style="endArrow=none;dashed=1;strokeColor=#6C8EBF;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="1200" y="120" as="sourcePoint"/><mxPoint x="1200" y="1200" as="targetPoint"/></mxGeometry></mxCell>
        <mxCell id="la6" value="" style="endArrow=none;dashed=1;strokeColor=#6C8EBF;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="1465" y="120" as="sourcePoint"/><mxPoint x="1465" y="1200" as="targetPoint"/></mxGeometry></mxCell>

        <mxCell id="n1" value="1) Ouvrir 'Mes candidatures'" style="endArrow=block;html=1;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="135" y="180" as="sourcePoint"/><mxPoint x="375" y="180" as="targetPoint"/></mxGeometry></mxCell>
        <mxCell id="n2" value="2) GET /api/candidatures/mes-candidatures/" style="endArrow=block;html=1;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="375" y="240" as="sourcePoint"/><mxPoint x="645" y="240" as="targetPoint"/></mxGeometry></mxCell>
        <mxCell id="n3" value="3) Lire statuts + historique" style="endArrow=block;html=1;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="645" y="300" as="sourcePoint"/><mxPoint x="925" y="300" as="targetPoint"/></mxGeometry></mxCell>
        <mxCell id="n4" value="4) 200 OK + etat candidature" style="endArrow=open;dashed=1;html=1;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="645" y="360" as="sourcePoint"/><mxPoint x="375" y="360" as="targetPoint"/></mxGeometry></mxCell>
        <mxCell id="n5" value="5) Afficher timeline d'avancement" style="endArrow=block;html=1;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="375" y="420" as="sourcePoint"/><mxPoint x="135" y="420" as="targetPoint"/></mxGeometry></mxCell>

        <mxCell id="sec34" value="US 3.4 Notification email lors changement etat" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#FFF2CC;strokeColor=#D6B656;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="40" y="500" width="430" height="30" as="geometry"/></mxCell>

        <mxCell id="n6" value="6) Commission change statut (ex: sous_examen/preselectionne/refuse)" style="endArrow=block;html=1;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="375" y="580" as="sourcePoint"/><mxPoint x="645" y="580" as="targetPoint"/></mxGeometry></mxCell>
        <mxCell id="n7" value="7) UPDATE candidature.statut" style="endArrow=block;html=1;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="645" y="640" as="sourcePoint"/><mxPoint x="925" y="640" as="targetPoint"/></mxGeometry></mxCell>
        <mxCell id="n8" value="8) Publier evenement statut_changed" style="endArrow=block;html=1;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="645" y="700" as="sourcePoint"/><mxPoint x="1200" y="700" as="targetPoint"/></mxGeometry></mxCell>
        <mxCell id="n9" value="9) Construire contenu notification" style="endArrow=block;html=1;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="1200" y="760" as="sourcePoint"/><mxPoint x="1200" y="800" as="targetPoint"/></mxGeometry></mxCell>
        <mxCell id="n10" value="10) Envoyer email" style="endArrow=block;html=1;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="1200" y="860" as="sourcePoint"/><mxPoint x="1465" y="860" as="targetPoint"/></mxGeometry></mxCell>
        <mxCell id="n11" value="11) Log succes/echec en base" style="endArrow=block;html=1;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="1200" y="920" as="sourcePoint"/><mxPoint x="925" y="920" as="targetPoint"/></mxGeometry></mxCell>
        <mxCell id="n12" value="12) Candidat consulte notification" style="endArrow=block;html=1;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="135" y="1000" as="sourcePoint"/><mxPoint x="375" y="1000" as="targetPoint"/></mxGeometry></mxCell>
        <mxCell id="n13" value="13) GET /api/candidatures/mes-notifications/" style="endArrow=block;html=1;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="375" y="1060" as="sourcePoint"/><mxPoint x="645" y="1060" as="targetPoint"/></mxGeometry></mxCell>
        <mxCell id="n14" value="14) Retour notifications" style="endArrow=open;dashed=1;html=1;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="645" y="1120" as="sourcePoint"/><mxPoint x="375" y="1120" as="targetPoint"/></mxGeometry></mxCell>
      </root>
    </mxGraphModel>
  </diagram>

  <diagram id="s2-35" name="Sprint2-3.5-Score-Classement">
    <mxGraphModel dx="1400" dy="900" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1800" pageHeight="1200" math="0" shadow="0">
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>

        <mxCell id="t3" value="Sprint 2 - Score et classement (US 3.5)" style="text;html=1;align=left;verticalAlign=middle;fontStyle=1;fontSize=16;" vertex="1" parent="1"><mxGeometry x="40" y="20" width="780" height="30" as="geometry"/></mxCell>

        <mxCell id="s1" value="Candidat" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#1F4E78;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="70" y="80" width="130" height="40" as="geometry"/></mxCell>
        <mxCell id="s2" value="Frontend Angular" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#1F4E78;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="300" y="80" width="170" height="40" as="geometry"/></mxCell>
        <mxCell id="s3" value="Candidature API" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#1F4E78;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="570" y="80" width="170" height="40" as="geometry"/></mxCell>
        <mxCell id="s4" value="Score Engine" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#1F4E78;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="860" y="80" width="150" height="40" as="geometry"/></mxCell>
        <mxCell id="s5" value="DB Classement" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#1F4E78;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="1120" y="80" width="170" height="40" as="geometry"/></mxCell>

        <mxCell id="sl1" value="" style="endArrow=none;dashed=1;strokeColor=#6C8EBF;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="135" y="120" as="sourcePoint"/><mxPoint x="135" y="1100" as="targetPoint"/></mxGeometry></mxCell>
        <mxCell id="sl2" value="" style="endArrow=none;dashed=1;strokeColor=#6C8EBF;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="385" y="120" as="sourcePoint"/><mxPoint x="385" y="1100" as="targetPoint"/></mxGeometry></mxCell>
        <mxCell id="sl3" value="" style="endArrow=none;dashed=1;strokeColor=#6C8EBF;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="655" y="120" as="sourcePoint"/><mxPoint x="655" y="1100" as="targetPoint"/></mxGeometry></mxCell>
        <mxCell id="sl4" value="" style="endArrow=none;dashed=1;strokeColor=#6C8EBF;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="935" y="120" as="sourcePoint"/><mxPoint x="935" y="1100" as="targetPoint"/></mxGeometry></mxCell>
        <mxCell id="sl5" value="" style="endArrow=none;dashed=1;strokeColor=#6C8EBF;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="1205" y="120" as="sourcePoint"/><mxPoint x="1205" y="1100" as="targetPoint"/></mxGeometry></mxCell>

        <mxCell id="sm1" value="1) Ouvrir score/classement" style="endArrow=block;html=1;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="135" y="180" as="sourcePoint"/><mxPoint x="385" y="180" as="targetPoint"/></mxGeometry></mxCell>
        <mxCell id="sm2" value="2) GET /api/candidatures/mes-candidatures/" style="endArrow=block;html=1;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="385" y="240" as="sourcePoint"/><mxPoint x="655" y="240" as="targetPoint"/></mxGeometry></mxCell>
        <mxCell id="sm3" value="3) Verifier score calcule ?" style="endArrow=block;html=1;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="655" y="300" as="sourcePoint"/><mxPoint x="935" y="300" as="targetPoint"/></mxGeometry></mxCell>

        <mxCell id="salt" value="alt [score manquant]" style="rounded=0;whiteSpace=wrap;html=1;strokeColor=#B85450;fillColor=none;dashed=1;" vertex="1" parent="1"><mxGeometry x="530" y="340" width="460" height="130" as="geometry"/></mxCell>
        <mxCell id="sm4" value="4a) POST /api/candidatures/{id}/calculer-score/" style="endArrow=block;html=1;strokeColor=#B85450;fontColor=#B85450;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="655" y="400" as="sourcePoint"/><mxPoint x="935" y="400" as="targetPoint"/></mxGeometry></mxCell>
        <mxCell id="sm5" value="5a) Sauvegarder score + rang" style="endArrow=block;html=1;strokeColor=#B85450;fontColor=#B85450;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="935" y="450" as="sourcePoint"/><mxPoint x="1205" y="450" as="targetPoint"/></mxGeometry></mxCell>

        <mxCell id="selse" value="else [score disponible]" style="rounded=0;whiteSpace=wrap;html=1;strokeColor=#82B366;fillColor=none;dashed=1;" vertex="1" parent="1"><mxGeometry x="530" y="490" width="760" height="260" as="geometry"/></mxCell>
        <mxCell id="sm6" value="4b) Lire score + classement" style="endArrow=block;html=1;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="655" y="560" as="sourcePoint"/><mxPoint x="1205" y="560" as="targetPoint"/></mxGeometry></mxCell>
        <mxCell id="sm7" value="5) Retour score, rang, statut" style="endArrow=open;dashed=1;html=1;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="655" y="620" as="sourcePoint"/><mxPoint x="385" y="620" as="targetPoint"/></mxGeometry></mxCell>
        <mxCell id="sm8" value="6) Afficher tableau score/classement" style="endArrow=block;html=1;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="385" y="680" as="sourcePoint"/><mxPoint x="135" y="680" as="targetPoint"/></mxGeometry></mxCell>
      </root>
    </mxGraphModel>
  </diagram>

  <diagram id="s2-36-37" name="Sprint2-3.6-3.7-Dossier-Preselectionne">
    <mxGraphModel dx="1400" dy="900" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1800" pageHeight="1400" math="0" shadow="0">
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>

        <mxCell id="t4" value="Sprint 2 - Dossier preselectionne (US 3.6, 3.7)" style="text;html=1;align=left;verticalAlign=middle;fontStyle=1;fontSize=16;" vertex="1" parent="1"><mxGeometry x="40" y="20" width="820" height="30" as="geometry"/></mxCell>

        <mxCell id="d1" value="Candidat preselectionne" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#1F4E78;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="60" y="80" width="170" height="40" as="geometry"/></mxCell>
        <mxCell id="d2" value="Frontend Angular" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#1F4E78;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="300" y="80" width="170" height="40" as="geometry"/></mxCell>
        <mxCell id="d3" value="Candidature API" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#1F4E78;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="560" y="80" width="170" height="40" as="geometry"/></mxCell>
        <mxCell id="d4" value="Config Delais" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#1F4E78;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="830" y="80" width="150" height="40" as="geometry"/></mxCell>
        <mxCell id="d5" value="Stockage Dossier" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#1F4E78;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="1080" y="80" width="170" height="40" as="geometry"/></mxCell>
        <mxCell id="d6" value="OCR/Validation" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#1F4E78;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="1340" y="80" width="160" height="40" as="geometry"/></mxCell>

        <mxCell id="dl1" value="" style="endArrow=none;dashed=1;strokeColor=#6C8EBF;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="145" y="120" as="sourcePoint"/><mxPoint x="145" y="1260" as="targetPoint"/></mxGeometry></mxCell>
        <mxCell id="dl2" value="" style="endArrow=none;dashed=1;strokeColor=#6C8EBF;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="385" y="120" as="sourcePoint"/><mxPoint x="385" y="1260" as="targetPoint"/></mxGeometry></mxCell>
        <mxCell id="dl3" value="" style="endArrow=none;dashed=1;strokeColor=#6C8EBF;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="645" y="120" as="sourcePoint"/><mxPoint x="645" y="1260" as="targetPoint"/></mxGeometry></mxCell>
        <mxCell id="dl4" value="" style="endArrow=none;dashed=1;strokeColor=#6C8EBF;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="905" y="120" as="sourcePoint"/><mxPoint x="905" y="1260" as="targetPoint"/></mxGeometry></mxCell>
        <mxCell id="dl5" value="" style="endArrow=none;dashed=1;strokeColor=#6C8EBF;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="1165" y="120" as="sourcePoint"/><mxPoint x="1165" y="1260" as="targetPoint"/></mxGeometry></mxCell>
        <mxCell id="dl6" value="" style="endArrow=none;dashed=1;strokeColor=#6C8EBF;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="1420" y="120" as="sourcePoint"/><mxPoint x="1420" y="1260" as="targetPoint"/></mxGeometry></mxCell>

        <mxCell id="dm1" value="1) Ouvrir 'Deposer dossier'" style="endArrow=block;html=1;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="145" y="180" as="sourcePoint"/><mxPoint x="385" y="180" as="targetPoint"/></mxGeometry></mxCell>
        <mxCell id="dm2" value="2) POST /api/candidatures/{id}/deposer-dossier/" style="endArrow=block;html=1;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="385" y="240" as="sourcePoint"/><mxPoint x="645" y="240" as="targetPoint"/></mxGeometry></mxCell>
        <mxCell id="dm3" value="3) Verifier statut=preselectionne" style="endArrow=block;html=1;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="645" y="300" as="sourcePoint"/><mxPoint x="645" y="340" as="targetPoint"/></mxGeometry></mxCell>
        <mxCell id="dm4" value="4) Verifier delai depot" style="endArrow=block;html=1;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="645" y="400" as="sourcePoint"/><mxPoint x="905" y="400" as="targetPoint"/></mxGeometry></mxCell>

        <mxCell id="dalt" value="alt [non preselectionne ou hors delai]" style="rounded=0;whiteSpace=wrap;html=1;strokeColor=#B85450;fillColor=none;dashed=1;" vertex="1" parent="1"><mxGeometry x="260" y="440" width="500" height="110" as="geometry"/></mxCell>
        <mxCell id="dm5" value="5a) 403 Depot refuse" style="endArrow=block;html=1;strokeColor=#B85450;fontColor=#B85450;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="645" y="500" as="sourcePoint"/><mxPoint x="385" y="500" as="targetPoint"/></mxGeometry></mxCell>

        <mxCell id="delse" value="else [eligible]" style="rounded=0;whiteSpace=wrap;html=1;strokeColor=#82B366;fillColor=none;dashed=1;" vertex="1" parent="1"><mxGeometry x="260" y="570" width="1270" height="360" as="geometry"/></mxCell>
        <mxCell id="dm6" value="5b) Upload pieces" style="endArrow=block;html=1;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="645" y="640" as="sourcePoint"/><mxPoint x="1165" y="640" as="targetPoint"/></mxGeometry></mxCell>
        <mxCell id="dm7" value="6) Lancer OCR/validation" style="endArrow=block;html=1;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="645" y="700" as="sourcePoint"/><mxPoint x="1420" y="700" as="targetPoint"/></mxGeometry></mxCell>
        <mxCell id="dm8" value="7) Sauvegarder dossier + statut dossier_depose" style="endArrow=block;html=1;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="645" y="760" as="sourcePoint"/><mxPoint x="1165" y="760" as="targetPoint"/></mxGeometry></mxCell>
        <mxCell id="dm9" value="8) 200 OK depot valide" style="endArrow=open;dashed=1;html=1;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="645" y="820" as="sourcePoint"/><mxPoint x="385" y="820" as="targetPoint"/></mxGeometry></mxCell>

        <mxCell id="sec37" value="US 3.7 Ajuster dossier avant expiration" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#FFF2CC;strokeColor=#D6B656;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="40" y="960" width="430" height="30" as="geometry"/></mxCell>
        <mxCell id="dm10" value="9) POST /api/candidatures/{id}/ajuster-dossier/" style="endArrow=block;html=1;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="385" y="1040" as="sourcePoint"/><mxPoint x="645" y="1040" as="targetPoint"/></mxGeometry></mxCell>
        <mxCell id="dm11" value="10) Re-check delai ajustement" style="endArrow=block;html=1;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="645" y="1100" as="sourcePoint"/><mxPoint x="905" y="1100" as="targetPoint"/></mxGeometry></mxCell>

        <mxCell id="dalt2" value="alt [delai depasse]" style="rounded=0;whiteSpace=wrap;html=1;strokeColor=#B85450;fillColor=none;dashed=1;" vertex="1" parent="1"><mxGeometry x="260" y="1140" width="470" height="95" as="geometry"/></mxCell>
        <mxCell id="dm12" value="11a) 403 Ajustement refuse" style="endArrow=block;html=1;strokeColor=#B85450;fontColor=#B85450;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="645" y="1190" as="sourcePoint"/><mxPoint x="385" y="1190" as="targetPoint"/></mxGeometry></mxCell>

        <mxCell id="delse2" value="else [dans delai]" style="rounded=0;whiteSpace=wrap;html=1;strokeColor=#82B366;fillColor=none;dashed=1;" vertex="1" parent="1"><mxGeometry x="260" y="1245" width="1270" height="110" as="geometry"/></mxCell>
        <mxCell id="dm13" value="11b) Remplacer/ajuster pieces et metadata" style="endArrow=block;html=1;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="645" y="1295" as="sourcePoint"/><mxPoint x="1165" y="1295" as="targetPoint"/></mxGeometry></mxCell>
        <mxCell id="dm14" value="12) 200 OK dossier ajuste" style="endArrow=open;dashed=1;html=1;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="645" y="1345" as="sourcePoint"/><mxPoint x="385" y="1345" as="targetPoint"/></mxGeometry></mxCell>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
