using AuthService.Application.DTOs;
using AuthService.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace AuthService.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class ProductsController(IProductService productService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ProductResponseDto>>> GetAll()
    {
        var products = await productService.GetAllAsync();
        return Ok(products);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ProductResponseDto>> GetById(string id)
    {
        var product = await productService.GetByIdAsync(id);
        return product is null ? NotFound() : Ok(product);
    }

    [HttpPost]
    public async Task<ActionResult<ProductResponseDto>> Create([FromBody] CreateProductDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var created = await productService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }
}
