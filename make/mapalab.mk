.PHONY: setup-hooks refresh-layer-tree plugin-zip plugin-tokens

##@ MapaLab

setup-hooks: ## Configurar los git hooks del proyecto
	@$(LIB)
	git config core.hooksPath .githooks

refresh-layer-tree: ## Regenerar el cache del arbol de capas
	@$(LIB)
	banner 'REFRESH' 'layer tree'
	rule
	refresh_layer_tree

plugin-zip: ## Empaquetar el plugin de QGIS para instalacion manual
	@$(LIB)
	banner 'PLUGIN' 'zip de QGIS'
	rule
	./scripts/build-plugin-zip.sh

plugin-tokens: ## Traer el theme.qss del modulo MEL de mariachi
	@$(LIB)
	banner 'PLUGIN' 'tokens de MEL'
	rule
	./scripts/sync-plugin-tokens.sh $(ARCHIVO)
