<mxfile host="app.diagrams.net" modified="2026-04-09T10:00:00.000Z" agent="GitHub Copilot" version="24.7.17" type="device">
  <diagram id="sprint1-auth-class" name="Sprint1-Class-Auth-Validated">
    <mxGraphModel dx="1420" dy="820" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1600" pageHeight="1000" math="0" shadow="0">
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>

        <mxCell id="user" value="&lt;b&gt;USER_CREDENTIAL&lt;/b&gt;&lt;hr/&gt;id: int&lt;br/&gt;first_name: string&lt;br/&gt;last_name: string&lt;br/&gt;email: string&lt;br/&gt;phone: string&lt;br/&gt;date_joined: datetime&lt;br/&gt;adresse: string&lt;br/&gt;user_name: string&lt;br/&gt;password: string&lt;br/&gt;is_active: boolean&lt;br/&gt;role_id: int (FK)&lt;hr/&gt;+login(user_name, password): Token&lt;br/&gt;+logout(): void&lt;br/&gt;+updateProfile(data): USER_CREDENTIAL&lt;br/&gt;+changePassword(oldPass, newPass): boolean&lt;br/&gt;+activate(): void&lt;br/&gt;+deactivate(): void&lt;br/&gt;+assignRole(role): void&lt;br/&gt;+verifyEmail(): boolean" style="rounded=0;whiteSpace=wrap;html=1;align=left;verticalAlign=top;spacing=6;strokeColor=#1F4E78;fillColor=#DAE8FC;fontSize=12;" vertex="1" parent="1">
          <mxGeometry x="40" y="80" width="340" height="430" as="geometry"/>
        </mxCell>

        <mxCell id="role" value="&lt;b&gt;ROLE&lt;/b&gt;&lt;hr/&gt;id_role: int&lt;br/&gt;nom: string&lt;br/&gt;description: text&lt;br/&gt;actif: boolean&lt;hr/&gt;+ajouterPermission(permission): void&lt;br/&gt;+retirerPermission(permission): void&lt;br/&gt;+verifierPermission(code): boolean&lt;br/&gt;+ajouterAction(action): void&lt;br/&gt;+retirerAction(action): void" style="rounded=0;whiteSpace=wrap;html=1;align=left;verticalAlign=top;spacing=6;strokeColor=#1F4E78;fillColor=#DAE8FC;fontSize=12;" vertex="1" parent="1">
          <mxGeometry x="500" y="80" width="320" height="290" as="geometry"/>
        </mxCell>

        <mxCell id="permission" value="&lt;b&gt;PERMISSION&lt;/b&gt;&lt;hr/&gt;id: int&lt;br/&gt;nom: string&lt;br/&gt;code: string&lt;br/&gt;ressource: string&lt;br/&gt;action: string&lt;br/&gt;description: text&lt;hr/&gt;+validerContexte(ressource, action): boolean&lt;br/&gt;+toCode(): string" style="rounded=0;whiteSpace=wrap;html=1;align=left;verticalAlign=top;spacing=6;strokeColor=#1F4E78;fillColor=#DAE8FC;fontSize=12;" vertex="1" parent="1">
          <mxGeometry x="500" y="450" width="320" height="250" as="geometry"/>
        </mxCell>

        <mxCell id="action" value="&lt;b&gt;ACTION&lt;/b&gt;&lt;hr/&gt;no_action: int&lt;br/&gt;name: string&lt;br/&gt;description: text&lt;br/&gt;module: string&lt;hr/&gt;+executer(): void&lt;br/&gt;+estAutorisee(role): boolean" style="rounded=0;whiteSpace=wrap;html=1;align=left;verticalAlign=top;spacing=6;strokeColor=#1F4E78;fillColor=#DAE8FC;fontSize=12;" vertex="1" parent="1">
          <mxGeometry x="960" y="230" width="300" height="220" as="geometry"/>
        </mxCell>

        <mxCell id="authentication" value="&lt;b&gt;AUTHENTICATION&lt;/b&gt;&lt;hr/&gt;id: int&lt;br/&gt;token_secret: string&lt;br/&gt;token_expiry: datetime&lt;br/&gt;refresh_token: string&lt;br/&gt;created_at: datetime&lt;br/&gt;revoked_at: datetime&lt;br/&gt;user_id: int (FK, UNIQUE)&lt;hr/&gt;+generateToken(user): string&lt;br/&gt;+validateToken(token): boolean&lt;br/&gt;+refreshToken(refresh_token): string&lt;br/&gt;+revokeToken(token): void&lt;br/&gt;+isExpired(): boolean" style="rounded=0;whiteSpace=wrap;html=1;align=left;verticalAlign=top;spacing=6;strokeColor=#1F4E78;fillColor=#DAE8FC;fontSize=12;" vertex="1" parent="1">
          <mxGeometry x="40" y="600" width="340" height="310" as="geometry"/>
        </mxCell>

        <mxCell id="e_user_role" value="possede" style="endArrow=none;html=1;rounded=0;strokeWidth=1.2;" edge="1" parent="1" source="user" target="role">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>
        <mxCell id="e_user_role_src" value="0..*" style="edgeLabel;html=1;align=left;verticalAlign=bottom;resizable=0;points=[];" vertex="1" connectable="0" parent="e_user_role">
          <mxGeometry x="-0.85" y="-1" relative="1" as="geometry">
            <mxPoint as="offset" x="-10" y="-6"/>
          </mxGeometry>
        </mxCell>
        <mxCell id="e_user_role_tgt" value="1" style="edgeLabel;html=1;align=right;verticalAlign=bottom;resizable=0;points=[];" vertex="1" connectable="0" parent="e_user_role">
          <mxGeometry x="0.9" y="-1" relative="1" as="geometry">
            <mxPoint as="offset" x="10" y="-6"/>
          </mxGeometry>
        </mxCell>

        <mxCell id="e_user_auth" value="utilise" style="endArrow=none;html=1;rounded=0;strokeWidth=1.2;" edge="1" parent="1" source="user" target="authentication">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>
        <mxCell id="e_user_auth_src" value="1" style="edgeLabel;html=1;align=left;verticalAlign=bottom;resizable=0;points=[];" vertex="1" connectable="0" parent="e_user_auth">
          <mxGeometry x="-0.85" y="-1" relative="1" as="geometry">
            <mxPoint as="offset" x="-10" y="-6"/>
          </mxGeometry>
        </mxCell>
        <mxCell id="e_user_auth_tgt" value="0..1" style="edgeLabel;html=1;align=right;verticalAlign=bottom;resizable=0;points=[];" vertex="1" connectable="0" parent="e_user_auth">
          <mxGeometry x="0.9" y="-1" relative="1" as="geometry">
            <mxPoint as="offset" x="10" y="-6"/>
          </mxGeometry>
        </mxCell>

        <mxCell id="e_role_permission" value="associe (via ROLE_PERMISSION)" style="endArrow=none;html=1;rounded=0;strokeWidth=1.2;" edge="1" parent="1" source="role" target="permission">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>
        <mxCell id="e_role_permission_src" value="0..*" style="edgeLabel;html=1;align=left;verticalAlign=bottom;resizable=0;points=[];" vertex="1" connectable="0" parent="e_role_permission">
          <mxGeometry x="-0.85" y="-1" relative="1" as="geometry">
            <mxPoint as="offset" x="-10" y="-6"/>
          </mxGeometry>
        </mxCell>
        <mxCell id="e_role_permission_tgt" value="0..*" style="edgeLabel;html=1;align=right;verticalAlign=bottom;resizable=0;points=[];" vertex="1" connectable="0" parent="e_role_permission">
          <mxGeometry x="0.9" y="-1" relative="1" as="geometry">
            <mxPoint as="offset" x="10" y="-6"/>
          </mxGeometry>
        </mxCell>

        <mxCell id="e_role_action" value="effectue (via ROLE_ACTION)" style="endArrow=none;html=1;rounded=0;strokeWidth=1.2;" edge="1" parent="1" source="role" target="action">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>
        <mxCell id="e_role_action_src" value="0..*" style="edgeLabel;html=1;align=left;verticalAlign=bottom;resizable=0;points=[];" vertex="1" connectable="0" parent="e_role_action">
          <mxGeometry x="-0.85" y="-1" relative="1" as="geometry">
            <mxPoint as="offset" x="-10" y="-6"/>
          </mxGeometry>
        </mxCell>
        <mxCell id="e_role_action_tgt" value="0..*" style="edgeLabel;html=1;align=right;verticalAlign=bottom;resizable=0;points=[];" vertex="1" connectable="0" parent="e_role_action">
          <mxGeometry x="0.9" y="-1" relative="1" as="geometry">
            <mxPoint as="offset" x="10" y="-6"/>
          </mxGeometry>
        </mxCell>

      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
