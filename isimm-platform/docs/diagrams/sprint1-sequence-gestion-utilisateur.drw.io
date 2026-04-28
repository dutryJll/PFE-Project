<mxfile host="app.diagrams.net" modified="2026-04-09T14:20:00.000Z" agent="GitHub Copilot" version="24.7.17" type="device">
  <diagram id="seq-user-only" name="Seq-Gestion-Utilisateur-Sprint1">
    <mxGraphModel dx="1400" dy="900" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1800" pageHeight="1500" math="0" shadow="0">
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>

        <mxCell id="tt2" value="Diagramme de sequence detaille - Gestion des utilisateurs (Sprint 1)" style="text;html=1;align=left;verticalAlign=middle;fontStyle=1;fontSize=16;" vertex="1" parent="1"><mxGeometry x="40" y="20" width="860" height="30" as="geometry"/></mxCell>

        <mxCell id="uh1" value="dashboard-admin.html" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#1F4E78;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="80" y="80" width="150" height="40" as="geometry"/></mxCell>
        <mxCell id="uh2" value="dashboard-admin.ts" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#1F4E78;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="320" y="80" width="170" height="40" as="geometry"/></mxCell>
        <mxCell id="uh3" value="auth_app/urls.py + views.py" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#1F4E78;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="600" y="80" width="200" height="40" as="geometry"/></mxCell>
        <mxCell id="uh4" value="models.py (User)" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#1F4E78;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="920" y="80" width="160" height="40" as="geometry"/></mxCell>

        <mxCell id="ul1" value="" style="endArrow=none;dashed=1;strokeColor=#6C8EBF;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="155" y="120" as="sourcePoint"/><mxPoint x="155" y="1360" as="targetPoint"/></mxGeometry></mxCell>
        <mxCell id="ul2" value="" style="endArrow=none;dashed=1;strokeColor=#6C8EBF;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="405" y="120" as="sourcePoint"/><mxPoint x="405" y="1360" as="targetPoint"/></mxGeometry></mxCell>
        <mxCell id="ul3" value="" style="endArrow=none;dashed=1;strokeColor=#6C8EBF;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="700" y="120" as="sourcePoint"/><mxPoint x="700" y="1360" as="targetPoint"/></mxGeometry></mxCell>
        <mxCell id="ul4" value="" style="endArrow=none;dashed=1;strokeColor=#6C8EBF;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="1000" y="120" as="sourcePoint"/><mxPoint x="1000" y="1360" as="targetPoint"/></mxGeometry></mxCell>

        <mxCell id="um1" value="1) Ouvrir ecran gestion utilisateurs" style="endArrow=block;html=1;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="155" y="180" as="sourcePoint"/><mxPoint x="405" y="180" as="targetPoint"/></mxGeometry></mxCell>
        <mxCell id="um2" value="2) GET /api/auth/users/" style="endArrow=block;html=1;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="405" y="240" as="sourcePoint"/><mxPoint x="700" y="240" as="targetPoint"/></mxGeometry></mxCell>
        <mxCell id="um3" value="3) Lire users" style="endArrow=block;html=1;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="700" y="300" as="sourcePoint"/><mxPoint x="1000" y="300" as="targetPoint"/></mxGeometry></mxCell>
        <mxCell id="um4" value="4) Retour liste" style="endArrow=open;dashed=1;html=1;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="1000" y="360" as="sourcePoint"/><mxPoint x="700" y="360" as="targetPoint"/></mxGeometry></mxCell>
        <mxCell id="um5" value="5) 200 OK" style="endArrow=open;dashed=1;html=1;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="700" y="420" as="sourcePoint"/><mxPoint x="405" y="420" as="targetPoint"/></mxGeometry></mxCell>

        <mxCell id="um6" value="6) Cliquer Ajouter" style="endArrow=block;html=1;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="155" y="500" as="sourcePoint"/><mxPoint x="405" y="500" as="targetPoint"/></mxGeometry></mxCell>
        <mxCell id="um7" value="7) POST /api/auth/users/create/" style="endArrow=block;html=1;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="405" y="560" as="sourcePoint"/><mxPoint x="700" y="560" as="targetPoint"/></mxGeometry></mxCell>

        <mxCell id="uAlt" value="alt donnees invalides" style="rounded=0;whiteSpace=wrap;html=1;strokeColor=#B85450;fillColor=none;dashed=1;" vertex="1" parent="1"><mxGeometry x="270" y="600" width="550" height="110" as="geometry"/></mxCell>
        <mxCell id="um8" value="8a) 400 Bad Request" style="endArrow=block;html=1;strokeColor=#B85450;fontColor=#B85450;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="700" y="660" as="sourcePoint"/><mxPoint x="405" y="660" as="targetPoint"/></mxGeometry></mxCell>

        <mxCell id="uElse" value="else donnees valides" style="rounded=0;whiteSpace=wrap;html=1;strokeColor=#82B366;fillColor=none;dashed=1;" vertex="1" parent="1"><mxGeometry x="270" y="730" width="840" height="620" as="geometry"/></mxCell>
        <mxCell id="um9" value="8b) Inserer USER_CREDENTIAL" style="endArrow=block;html=1;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="700" y="800" as="sourcePoint"/><mxPoint x="1000" y="800" as="targetPoint"/></mxGeometry></mxCell>
        <mxCell id="um10" value="9) 201 Created" style="endArrow=open;dashed=1;html=1;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="700" y="860" as="sourcePoint"/><mxPoint x="405" y="860" as="targetPoint"/></mxGeometry></mxCell>
        <mxCell id="um11" value="10) Cliquer Modifier" style="endArrow=block;html=1;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="155" y="940" as="sourcePoint"/><mxPoint x="405" y="940" as="targetPoint"/></mxGeometry></mxCell>
        <mxCell id="um12" value="11) PUT /api/auth/users/{id}/" style="endArrow=block;html=1;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="405" y="1000" as="sourcePoint"/><mxPoint x="700" y="1000" as="targetPoint"/></mxGeometry></mxCell>
        <mxCell id="um13" value="12) Update user" style="endArrow=block;html=1;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="700" y="1060" as="sourcePoint"/><mxPoint x="1000" y="1060" as="targetPoint"/></mxGeometry></mxCell>
        <mxCell id="um14" value="13) 200 OK" style="endArrow=open;dashed=1;html=1;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="700" y="1120" as="sourcePoint"/><mxPoint x="405" y="1120" as="targetPoint"/></mxGeometry></mxCell>
        <mxCell id="um15" value="14) Cliquer Supprimer + confirmer" style="endArrow=block;html=1;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="155" y="1200" as="sourcePoint"/><mxPoint x="405" y="1200" as="targetPoint"/></mxGeometry></mxCell>
        <mxCell id="um16" value="15) DELETE /api/auth/users/{id}/delete/" style="endArrow=block;html=1;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="405" y="1260" as="sourcePoint"/><mxPoint x="700" y="1260" as="targetPoint"/></mxGeometry></mxCell>
        <mxCell id="um17" value="16) Supprimer compte" style="endArrow=block;html=1;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="700" y="1320" as="sourcePoint"/><mxPoint x="1000" y="1320" as="targetPoint"/></mxGeometry></mxCell>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
