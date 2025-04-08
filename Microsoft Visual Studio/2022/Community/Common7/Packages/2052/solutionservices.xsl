<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/TR/WD-xsl">
	<xsl:template match="/">
		<h1 _locID="L_string01_Text">此解决方案中的 Web 服务</h1>
		<p tabIndex="1" _locID="L_string02_Text">下面列出了此解决方案中可用的 Web 服务。
            单击服务链接可以浏览该服务。</p>
		<table class="listpage" cellpadding="3" cellspacing="1" frame="void" bordercolor="#ffffff" rules="rows" width="100%" align="center">
    	    <xsl:choose>
				<xsl:when test="solutionDiscovery/solutionRef">
					<tr valign="center" align="left">
						<td class="header" width="125" _locID="L_string03_Text" nowrap="true">服务</td>
						<td class="header" width="125" _locID="L_string04_Text">项目</td>
                        <td class="header" _locID="L_string05_Text">URL</td>
					</tr>
					<xsl:for-each select="solutionDiscovery/solutionRef" order-by="@p2pref">
						<tr valign="center" align="left">
							<td class="tbltext" tabIndex="2">
								<a _locID="L_string06_Text"><xsl:attribute name="href"><xsl:value-of select="@p2pref"/></xsl:attribute><xsl:value-of select="@name"/></a>
							</td>
							<td class="tbltext" tabIndex="3" nowrap="true">
								<xsl:value-of select="@project"/>
							</td>
							<td class="tbltext" tabIndex="4" nowrap="true">
								<xsl:value-of select="@relref"/>
							</td>
						</tr>
					</xsl:for-each>
				</xsl:when>
				<xsl:otherwise>
					<tr>
						<td class="tbltext" tabIndex="5" colspan="2" _locID="L_string07_Text">无 - 当前解决方案中未找到 Web 服务。</td>
					</tr>
				</xsl:otherwise>
			</xsl:choose>
		</table>
	</xsl:template>
</xsl:stylesheet>
